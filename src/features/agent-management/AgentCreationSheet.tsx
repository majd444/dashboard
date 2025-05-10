import React, { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, X, AlertCircle, ImagePlus, Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { saveAgent, Agent, updateAgent } from '@/lib/agents';
import { toast } from '@/hooks/use-toast';
import { ChatbotWidget } from '../chatbot/ChatbotWidget';
import { Checkbox } from "@/components/ui/checkbox";
import { v4 as uuidv4 } from 'uuid';

interface AgentCreationSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  existingAgent?: Agent | null;
  type?: string;
}

interface Document {
  filename: string;
  created: string;
  size: number;
  type?: string;
}

// Define a type for the preview agent, extending the base Agent type
interface PreviewAgent extends Agent {
  topColor?: string;
  accentColor?: string;
}

// Helper component for color swatches (defined outside the main component)
const ColorSwatch = ({ color, onClick, isSelected }: { color: string; onClick: () => void; isSelected: boolean }) => (
  <button
    type="button"
    className={`w-6 h-6 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${isSelected ? 'ring-2 ring-offset-1 ring-blue-600' : ''}`}
    style={{ backgroundColor: color }}
    onClick={onClick}
    aria-label={`Select color ${color}`}
  />
);

export const AgentCreationSheet: React.FC<AgentCreationSheetProps> = ({ 
  isOpen, 
  onOpenChange,
  existingAgent = null
}) => {
  const [botName, setBotName] = useState(existingAgent?.name || "");
  const [selectedLLM, setSelectedLLM] = useState(existingAgent?.model || "nvidia/llama-3.1-nemotron-nano-8b-v1:free");
  const [apiKey, setApiKey] = useState(existingAgent?.apiKey || "");
  const [temperature, setTemperature] = useState(existingAgent?.temperature || 0.7);
  const [promptText, setPromptText] = useState(existingAgent?.prompt || "");
  const [isEditing, setIsEditing] = useState(false);
  const [agentId, setAgentId] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<Date>(new Date());
  const [showChatbot, setShowChatbot] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [promptError, setPromptError] = useState<string>('');
  
  // Fine tuning state
  const [url, setUrl] = useState<string>("");
  const [fileMode, setFileMode] = useState<boolean>(false);
  const [isExtractingUrl, setIsExtractingUrl] = useState<boolean>(false);
  const [urlResult, setUrlResult] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [currentFilename, setCurrentFilename] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [extractionServiceAvailable, setExtractionServiceAvailable] = useState<boolean>(true);
  
  // Style customization options
  const [topColor, setTopColor] = useState(existingAgent?.primaryColor || "#1f2937");
  const [backgroundColor, setBackgroundColor] = useState(existingAgent?.backgroundColor || "#F3F4F6");
  const [accentColor, setAccentColor] = useState("#3B82F6");
  const [outsideImageUrl, setOutsideImageUrl] = useState(existingAgent?.outsideImageUrl || "");
  const [outsideText, setOutsideText] = useState(existingAgent?.outsideText || "");
  const [refreshChatbot, setRefreshChatbot] = useState(0);
  const [_optionsOpen, setOptionsOpen] = useState<boolean>(false);
  
  // Add knowledge base to the component state
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(existingAgent?.knowledgeBase?.enabled || false);
  const [knowledgeBaseDatasets, setKnowledgeBaseDatasets] = useState<string[]>(existingAgent?.knowledgeBase?.datasets || []);
  
  // Add state for avatar upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  
  // Define the Flat UI Colors palette
  const colorPalette = [
    '#1abc9c', // Turquoise
    '#16a085', // Greensea
    '#2ecc71', // Emerald
    '#27ae60', // Nephritis
    '#3498db', // Peterriver
    '#2980b9', // Belizehole
    '#9b59b6', // Amethyst
    '#8e44ad', // Wisteria
    '#34495e', // Wetasphalt
    '#2c3e50', // Midnightblue
    '#f1c40f', // Sunflower
    '#f39c12', // Orange
    '#e67e22', // Carrot
    '#d35400', // Pumpkin
    '#e74c3c', // Alizarin
    '#c0392b', // Pomegranate
    '#ecf0f1', // Clouds
    '#bdc3c7', // Silver
    '#95a5a6', // Concrete
    '#7f8c8d'  // Asbestos
  ];
  
  // Add state for popover visibility
  const [isTopColorPopoverOpen, setIsTopColorPopoverOpen] = useState(false);
  const [isAccentColorPopoverOpen, setIsAccentColorPopoverOpen] = useState(false);
  const [isBackgroundColorPopoverOpen, setIsBackgroundColorPopoverOpen] = useState(false);
  
  const checkExtractionService = async () => {
    try {
      const response = await fetch('http://localhost:5055/api/health', { 
        signal: AbortSignal.timeout(2000) // Timeout after 2 seconds
      });
      setExtractionServiceAvailable(response.ok);
    } catch (error) {
      console.error("Extraction service unavailable:", error);
      setExtractionServiceAvailable(false);
    }
  };
  
  // Define loadDocuments with useCallback to prevent recreation on every render
  const loadDocuments = useCallback(async () => {
    if (!extractionServiceAvailable) {
      setDocuments([]);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Loading documents from extraction service");
      const response = await fetch(`http://localhost:5055/api/datasets`, { 
        signal: AbortSignal.timeout(5000) // Timeout after 5 seconds
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Loaded documents:", data);
      
      if (response.ok) {
        // Sort by date, newest first
        const sortedData = [...data.datasets].sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );
        
        // Don't filter out finetuning datasets anymore - we want to use them
        setDocuments(sortedData);
      } else {
        toast({
          title: "Error loading documents",
          description: data.error || "Failed to load documents",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      setExtractionServiceAvailable(false);
      toast({
        title: "Error loading documents",
        description: "Extraction service unavailable. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [extractionServiceAvailable]);
  
  // Check extraction service and initialize
  useEffect(() => {
    if (existingAgent) {
      setBotName(existingAgent.name);
      // Convert old model format if needed
      if (existingAgent.model === 'nvidia-llama-3.1-nemotron-nano-8b') {
        setSelectedLLM('nvidia/llama-3.1-nemotron-nano-8b-v1:free');
      } else {
        setSelectedLLM(existingAgent.model);
      }
      setTemperature(existingAgent.temperature);
      setPromptText(existingAgent.prompt);
      setAgentId(existingAgent.id);
      setCreatedAt(new Date(existingAgent.createdAt));
      setIsEditing(true);
      
      // Load style settings if they exist
      if (existingAgent.primaryColor) setTopColor(existingAgent.primaryColor);
      if (existingAgent.backgroundColor) setBackgroundColor(existingAgent.backgroundColor);
      if (existingAgent.outsideImageUrl) setOutsideImageUrl(existingAgent.outsideImageUrl);
      if (existingAgent.outsideText) setOutsideText(existingAgent.outsideText);
      if (existingAgent.apiKey) setApiKey(existingAgent.apiKey);
      
      // Load knowledge base if it exists
      if (existingAgent.knowledgeBase) {
        setKnowledgeBaseEnabled(existingAgent.knowledgeBase.enabled);
        setKnowledgeBaseDatasets(existingAgent.knowledgeBase.datasets || []);
      }
      
      // Set avatar preview if avatar exists (assuming it's a Data URL)
      if (existingAgent.avatar) {
        setAvatarPreviewUrl(existingAgent.avatar);
      }
    } else {
      setBotName('AI Assistant');
      setSelectedLLM('nvidia/llama-3.1-nemotron-nano-8b-v1:free');
      setTemperature(0.7);
      setPromptText('You are a helpful AI assistant.');
      setAgentId('');
      setCreatedAt(new Date());
      setIsEditing(false);
      setTopColor('#1f2937');
      setBackgroundColor('#F3F4F6');
      setAccentColor('#3B82F6');
      setOutsideImageUrl('');
      setOutsideText('Chat with our AI assistant!');
      setApiKey('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');
      setAvatarPreviewUrl(null); // Reset preview for new agent
    }
    setShowChatbot(false);
    setActiveTab('configuration');
    
    // Check if extraction service is available
    checkExtractionService();
    
    // Load documents when the drawer opens if service is available
    if (isOpen && extractionServiceAvailable) {
      loadDocuments();
    }
  }, [existingAgent, isOpen, extractionServiceAvailable, loadDocuments]);
  
  // Separate effect to load documents when fine-tuning tab is clicked
  useEffect(() => {
    if (activeTab === 'finetuning' && isOpen && extractionServiceAvailable) {
      loadDocuments();
    }
  }, [activeTab, isOpen, extractionServiceAvailable, loadDocuments]);
  
  // Validate API key format
  useEffect(() => {
    if (apiKey && !apiKey.startsWith('sk-or-v1-')) {
      setApiKeyError('API key should start with sk-or-v1-');
    } else if (apiKey && apiKey.length < 20) {
      setApiKeyError('API key seems too short');
    } else {
      setApiKeyError('');
    }
  }, [apiKey]);
  
  // Validate prompt text
  useEffect(() => {
    if (promptText.length < 10) {
      setPromptError('Prompt should be at least 10 characters long');
    } else {
      setPromptError('');
    }
  }, [promptText]);
  
  // Effect for cleaning up object URLs
  useEffect(() => {
    // Revoke object URL when component unmounts or preview URL changes
    return () => {
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);
  
  const handleSaveBot = () => {
    // Validate before saving
    if (promptError || apiKeyError || !botName) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
      return;
    }
    
    const saveAgentData = (avatarDataUrl: string | undefined = undefined) => {
        const agentKnowledgeBase = {
            enabled: knowledgeBaseEnabled,
            datasets: knowledgeBaseDatasets,
        };

        // Construct agent data, including the avatar URL if provided
        const agentPayload: Partial<Agent> = {
            name: botName,
            prompt: promptText,
            model: selectedLLM,
            apiKey: apiKey,
            temperature: temperature,
            primaryColor: topColor, // Still saving topColor as primaryColor for now
            backgroundColor,
            outsideImageUrl,
            outsideText,
            knowledgeBase: agentKnowledgeBase,
            ...(avatarDataUrl && { avatar: avatarDataUrl }), // Conditionally add avatar
        };

        if (isEditing) {
            const updatedAgent: Agent = {
                ...(agentPayload as Omit<Agent, 'id' | 'createdAt'>), // Type assertion
                id: agentId,
                createdAt: createdAt,
            };
            updateAgent(updatedAgent);
            toast({
                title: "Agent Updated",
                description: `${botName} has been successfully updated.`,
            });
        } else {
            const newAgent: Agent = {
                ...(agentPayload as Omit<Agent, 'id' | 'createdAt'>), // Type assertion
                id: uuidv4(), // Use uuidv4 for new agent ID
                createdAt: new Date(),
            };
            saveAgent(newAgent);
            toast({
                title: "Agent Created",
                description: `${botName} has been successfully created.`,
            });
        }

        // Trigger updates and close
        window.dispatchEvent(new Event('agentsUpdated'));
        onOpenChange(false);
    };

    // Check if a new avatar file was selected
    if (avatarFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Once file is read as Data URL, save agent data
            saveAgentData(reader.result as string);
        };
        reader.onerror = () => {
            console.error("Error reading avatar file.");
            toast({ title: "Avatar Error", description: "Could not process the avatar image.", variant: "destructive" });
            saveAgentData(avatarPreviewUrl || undefined); // Save with existing avatar on error
        };
        reader.readAsDataURL(avatarFile); // Read the file
    } else {
        // No new file, just save with the potentially existing avatar URL (or null if removed)
        saveAgentData(avatarPreviewUrl || undefined); // Pass current preview URL (might be old avatar or null)
    }
  };

  const getCurrentAgent = (): PreviewAgent | null => {
    if (!botName || !selectedLLM) return null;
    
    // Return data for preview, including temporary fields if needed
    // Include the current avatar preview URL for the widget
    return {
      id: agentId,
      name: botName,
      prompt: promptText,
      model: selectedLLM,
      apiKey: apiKey,
      temperature: temperature,
      createdAt: createdAt,
      primaryColor: topColor, // Keep primaryColor field populated with topColor for saving compatibility
      backgroundColor,
      outsideImageUrl,
      outsideText,
      knowledgeBase: {
        enabled: knowledgeBaseEnabled,
        datasets: knowledgeBaseDatasets
      },
      avatar: avatarPreviewUrl || undefined, // Pass the current preview URL
      // Add temporary fields for preview
      topColor: topColor, 
      accentColor: accentColor 
    } as PreviewAgent; // Use PreviewAgent type assertion
  };

  const handleTestChatbot = () => {
    // Validate before testing
    if (promptError || apiKeyError) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before testing",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure the prompt is applied 
    setShowChatbot(true);
    // Force a refresh to ensure the prompt is applied
    setRefreshChatbot(prev => prev + 1);
  };
  
  const handleRefreshChatbot = () => {
    setRefreshChatbot(prev => prev + 1);
  };

  const handleBackToConfig = () => {
    setShowChatbot(false);
    setActiveTab('configuration');
  };
  
  const handleExtractUrl = async () => {
    if (!url || fileMode) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }
    
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast({
        title: "Invalid URL",
        description: "URL must start with http:// or https://",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsExtractingUrl(true);
      console.log("Extracting URL:", url);
      const response = await fetch(`http://localhost:5055/api/extract/url`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(30000) // 30 second timeout for extraction
      });
      
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      
      if (response.ok) {
        setUrlResult(data.message || "Content successfully extracted");
        toast({
          title: "Extraction Complete",
          description: "URL content has been successfully extracted",
        });
        
        // Refresh the document list
        loadDocuments();
      } else {
        setUrlResult(data.error || "Failed to extract content");
        toast({
          title: "Extraction Failed",
          description: data.error || "Failed to extract content from URL",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error extracting URL content:", error);
      setUrlResult("Error: " + (error instanceof Error ? error.message : String(error)));
      toast({
        title: "Extraction Error",
        description: "Connection to extraction service failed. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsExtractingUrl(false);
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB max file size
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }
    
    // Check file type
    const validTypes = ['.pdf', '.docx', '.txt', '.md', '.csv', '.json'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExt)) {
      toast({
        title: "Invalid file type",
        description: `Supported file types: ${validTypes.join(', ')}`,
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`http://localhost:5055/api/upload`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000) // 30 second timeout for upload
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Upload Complete",
          description: "File has been successfully uploaded and processed",
        });
        
        // Refresh the document list
        loadDocuments();
      } else {
        toast({
          title: "Upload Failed",
          description: data.error || "Failed to upload file",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Error",
        description: "Connection to extraction service failed. Please try again later.",
        variant: "destructive"
      });
    } finally {
      // Reset file input value to allow reupload of same file
      e.target.value = '';
    }
  };
  
  const handleDeleteDocument = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:5055/api/datasets/${filename}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        // Update documents list by removing the deleted item
        setDocuments(prevDocs => prevDocs.filter(doc => doc.filename !== filename));
        
        toast({
          title: "x",
          description: "x",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Deletion Failed",
          description: data.error || "Failed to delete document",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Deletion Error",
        description: "Connection to extraction service failed. Please try again later.",
        variant: "destructive"
      });
    }
  };
  
  const openDocumentViewer = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:5055/api/datasets/${filename}`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.text();
        setFileContent(data);
        setCurrentFilename(filename);
        setViewerOpen(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error Viewing Document",
          description: errorData.error || "Failed to load document content",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      toast({
        title: "Error Viewing Document", 
        description: "Connection to extraction service failed. Please try again later.",
        variant: "destructive"
      });
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Log component render and isOpen state
  console.log(`AgentCreationSheet rendering. isOpen: ${isOpen}`);

  // Handler for avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (optional)
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // Example: 2MB limit
         toast({ title: "File Too Large", description: "Image size should not exceed 2MB.", variant: "destructive" });
         return;
      }

      setAvatarFile(file); // Store the file object

      // Clean up previous blob URL if exists
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      
      // Create and set preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreviewUrl(previewUrl);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full max-h-[100vh] h-[100vh] w-full m-0 p-0 rounded-none flex flex-col overflow-hidden">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? `Edit ${botName}` : 'Create New Agent'}
            </DialogTitle>
            <DialogDescription className="sr-only"> {/* Screen-reader only description */} 
              {isEditing ? `Dialog to edit the ${botName} agent configuration.` : 'Dialog to create a new agent configuration.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <div className="p-6 flex h-full">
              {/* Main content area - always takes 3/4 of the space */}
              <div className="w-3/4 pr-6 overflow-y-auto">
                <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                    <TabsTrigger value="finetuning">Fine-tuning</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="configuration" className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="bot-name">Name</Label>
                      <Input 
                        id="bot-name" 
                        value={botName} 
                        onChange={(e) => setBotName(e.target.value)}
                        placeholder="Enter a name for your bot"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="llm-model">Language Model</Label>
                      <select 
                        id="llm-model"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedLLM}
                        onChange={(e) => setSelectedLLM(e.target.value)}
                      >
                        <option value="nvidia/llama-3.1-nemotron-nano-8b-v1:free">Llama 3.1 Nemotron Nano 8B (Free)</option>
                        <option value="meta/llama-3-8b-instruct:free">Llama 3 8B Instruct (Free)</option>
                        <option value="anthropic/claude-3-opus-20240229:paid">Claude 3 Opus (API Key Required)</option>
                        <option value="anthropic/claude-3-sonnet-20240229:paid">Claude 3 Sonnet (API Key Required)</option>
                        <option value="anthropic/claude-3-haiku-20240307:paid">Claude 3 Haiku (API Key Required)</option>
                        <option value="openai/gpt-4o:paid">GPT-4o (API Key Required)</option>
                        <option value="openai/gpt-4-turbo:paid">GPT-4 Turbo (API Key Required)</option>
                        <option value="openai/gpt-3.5-turbo:paid">GPT-3.5 Turbo (API Key Required)</option>
                      </select>
                    </div>
                    
                    {selectedLLM.includes(':paid') && (
                      <div>
                        {/* The following Label and Input components are removed */}
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="temperature" className="flex justify-between">
                        <span>Temperature: {temperature}</span>
                        <span className="text-xs text-gray-500">
                          {temperature < 0.3 ? "More precise" : temperature > 0.7 ? "More creative" : "Balanced"}
                        </span>
                      </Label>
                      <input 
                        id="temperature"
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="prompt" className="flex items-center">
                        System Prompt
                        {promptError && (
                          <span className="ml-2 text-xs text-red-500 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" /> {promptError}
                          </span>
                        )}
                      </Label>
                      <Textarea 
                        id="prompt"
                        value={promptText} 
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Enter instructions for your AI assistant"
                        className={`min-h-[200px] ${promptError ? "border-red-500" : ""}`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This prompt defines your assistant's personality and capabilities.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="finetuning" className="space-y-4 py-4">
                    {!extractionServiceAvailable ? (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                        <h3 className="font-semibold flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                          Extraction Service Unavailable
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          The document extraction service is not running. Please start the service
                          to upload and manage documents.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={checkExtractionService}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" /> Retry Connection
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                          <h3 className="font-semibold">Document Management</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Upload documents to include in your agent's knowledge base. These documents will be processed
                            and used to enhance your agent's responses.
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant={fileMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFileMode(false)}
                          >
                            URL Import
                          </Button>
                          <Button
                            variant={fileMode ? "outline" : "default"}
                            size="sm"
                            onClick={() => setFileMode(true)}
                          >
                            File Upload
                          </Button>
                        </div>
                        
                        {fileMode ? (
                          <div className="space-y-2">
                            <Label htmlFor="file-upload">Upload File</Label>
                            <Input
                              id="file-upload"
                              type="file"
                              onChange={handleFileUpload}
                              accept=".pdf,.docx,.txt,.md,.csv,.json"
                            />
                            <p className="text-xs text-gray-500">
                              Supported formats: PDF, DOCX, TXT, MD, CSV, JSON (Max 10MB)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="url-input">Web URL</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="url-input"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                disabled={isExtractingUrl}
                              />
                              <Button
                                onClick={handleExtractUrl}
                                disabled={isExtractingUrl || !url}
                              >
                                {isExtractingUrl ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Extracting...
                                  </>
                                ) : (
                                  <>Extract</>
                                )}
                              </Button>
                            </div>
                            {urlResult && (
                              <p className="text-sm mt-2 p-2 bg-gray-50 rounded border">
                                {urlResult}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="border rounded-md overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                            <h3 className="font-medium">Uploaded Documents</h3>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={loadDocuments}
                              disabled={isLoading}
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                              Refresh
                            </Button>
                          </div>
                          
                          <div className="max-h-[300px] overflow-y-auto">
                            {documents.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                {isLoading ? (
                                  <div className="flex items-center justify-center">
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Loading documents...
                                  </div>
                                ) : (
                                  'No documents uploaded yet'
                                )}
                              </div>
                            ) : (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left">
                                  <tr>
                                    <th className="px-4 py-2">Filename</th>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Size</th>
                                    <th className="px-4 py-2">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {documents.map((doc) => (
                                    <tr key={doc.filename} className="border-t hover:bg-gray-50">
                                      <td className="px-4 py-2 font-medium">{doc.filename}</td>
                                      <td className="px-4 py-2 text-gray-500">{formatDate(doc.created)}</td>
                                      <td className="px-4 py-2 text-gray-500">{formatFileSize(doc.size)}</td>
                                      <td className="px-4 py-2">
                                        <div className="flex space-x-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDocumentViewer(doc.filename)}
                                          >
                                            <FileText className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteDocument(doc.filename)}
                                          >
                                            <X className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="style" className="space-y-6 py-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                      <h3 className="font-semibold">Chatbot Appearance</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Customize the appearance of your chatbot to match your brand or website design.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      {/* Top Color Picker (Popover + Text Input) */}
                      <div>
                        <Label htmlFor="top-color-input">Top Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Popover open={isTopColorPopoverOpen} onOpenChange={setIsTopColorPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="p-2 h-10 w-10 flex-shrink-0">
                                <div className="w-full h-full rounded border" style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(topColor) ? topColor : '#000000' }}></div>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 bg-white rounded shadow-lg border">
                              <div className="grid grid-cols-10 gap-1"> 
                                {colorPalette.map((color, index) => (
                                  <ColorSwatch 
                                    key={`top-${color}-${index}`}
                                    color={color}
                                    onClick={() => { 
                                      setTopColor(color);
                                      setIsTopColorPopoverOpen(false);
                                    }}
                                    isSelected={topColor === color}
                                  />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Input
                            id="top-color-input" 
                            value={topColor}
                            onChange={(e) => setTopColor(e.target.value)}
                            className="font-mono flex-grow"
                            placeholder="#rrggbb"
                          />
                        </div>
                      </div>

                      {/* Accent Color Picker (Popover + Text Input) */}
                      <div>
                        <Label htmlFor="accent-color-input">Accent Color (Buttons/Icons)</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Popover open={isAccentColorPopoverOpen} onOpenChange={setIsAccentColorPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="p-2 h-10 w-10 flex-shrink-0">
                                <div className="w-full h-full rounded border" style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : '#000000' }}></div>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 bg-white rounded shadow-lg border">
                              <div className="grid grid-cols-10 gap-1"> 
                                {colorPalette.map((color, index) => (
                                  <ColorSwatch 
                                    key={`accent-${color}-${index}`}
                                    color={color}
                                    onClick={() => { 
                                      setAccentColor(color);
                                      setIsAccentColorPopoverOpen(false);
                                    }}
                                    isSelected={accentColor === color}
                                  />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Input
                            id="accent-color-input"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="font-mono flex-grow"
                            placeholder="#rrggbb"
                          />
                        </div>
                      </div>

                      {/* Background Color Picker (Popover + Text Input) */}
                      <div>
                        <Label htmlFor="background-color-input">Background Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Popover open={isBackgroundColorPopoverOpen} onOpenChange={setIsBackgroundColorPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="p-2 h-10 w-10 flex-shrink-0">
                                <div className="w-full h-full rounded border" style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(backgroundColor) ? backgroundColor : '#ffffff' }}></div>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 bg-white rounded shadow-lg border">
                              <div className="grid grid-cols-10 gap-1"> 
                                {colorPalette.map((color, index) => (
                                  <ColorSwatch 
                                    key={`bg-${color}-${index}`}
                                    color={color}
                                    onClick={() => { 
                                      setBackgroundColor(color);
                                      setIsBackgroundColorPopoverOpen(false);
                                    }}
                                    isSelected={backgroundColor === color}
                                  />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Input
                            id="background-color-input"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="font-mono flex-grow"
                            placeholder="#rrggbb"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Avatar Upload Section */}
                    <div>
                      <Label htmlFor="avatar-upload">Chatbot Avatar</Label>
                      <div className="flex items-center gap-4 mt-1">
                        {/* Avatar Preview */}
                        <div className="w-16 h-16 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
                          {avatarPreviewUrl ? (
                            <img src={avatarPreviewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Bot size={32} className="text-gray-400" /> // Placeholder
                          )}
                        </div>
                        {/* Upload Button */}
                        <Button variant="outline" asChild>
                          <label htmlFor="avatar-upload" className="cursor-pointer flex items-center gap-2">
                            <ImagePlus size={16} />
                            Upload Image
                            <input 
                              id="avatar-upload" 
                              type="file" 
                              accept="image/png, image/jpeg, image/gif" 
                              onChange={handleAvatarChange} 
                              className="sr-only" // Hide default input visually
                            />
                          </label>
                        </Button>
                        {avatarPreviewUrl && (
                           <Button variant="ghost" size="sm" onClick={() => {setAvatarPreviewUrl(null); setAvatarFile(null);}} className="text-xs text-red-600">Remove</Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Recommended: Square image, max 2MB.</p>
                    </div>
                    
                    {/* Outside Button Image/Text Inputs remain */}
                    <div>
                      <Label htmlFor="outside-image">Outside Button Image URL (optional)</Label>
                      <Input
                        id="outside-image"
                        value={outsideImageUrl}
                        onChange={(e) => setOutsideImageUrl(e.target.value)}
                        placeholder="https://example.com/image.png"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use the default chatbot icon
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="outside-text">Outside Button Text</Label>
                      <Input
                        id="outside-text"
                        value={outsideText}
                        onChange={(e) => setOutsideText(e.target.value)}
                        placeholder="Chat with our AI assistant!"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="space-y-4 py-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                      <h3 className="font-semibold flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                        Coming Soon
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Chat history and analytics will be available in a future update. This will allow you
                        to view past conversations and gain insights into how your assistant is being used.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button 
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveBot}>
                    {isEditing ? 'Update Agent' : 'Save Agent'}
                  </Button>
                </div>
              </div>
              
              {/* Chatbot area - always takes 1/4 of the space on the right */}
              <div className="w-1/4 border-l pl-6 flex flex-col h-full">
                <div className="flex-1 border rounded-md overflow-hidden">
                  <ChatbotWidget 
                    key={refreshChatbot} 
                    agent={getCurrentAgent()} 
                    onClose={() => {}}
                    isEmbedded={true}
                    customStyles={{
                      primaryColor: accentColor,
                      backgroundColor,
                      headerBackgroundColor: topColor
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{currentFilename}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <pre className="text-sm p-4 bg-gray-50 rounded whitespace-pre-wrap">
              {fileContent}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewerOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
