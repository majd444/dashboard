export interface Agent {
  id: string;
  name: string;
  prompt: string;
  model: string;
  apiKey?: string;
  temperature: number;
  createdAt: Date;
  avatar?: string;
  // Style customization properties
  primaryColor?: string;
  backgroundColor?: string;
  outsideImageUrl?: string;
  outsideText?: string;
  // Knowledge base
  knowledgeBase?: {
    enabled: boolean;
    datasets: string[];
  };
}

// For demo purposes, we'll use localStorage to store agents
export const saveAgent = (agent: Agent): void => {
  const agents = getAgents();
  agents.push(agent);
  localStorage.setItem('agents', JSON.stringify(agents));
};

export const getAgents = (): Agent[] => {
  const agentsJson = localStorage.getItem('agents');
  if (!agentsJson) return [];
  
  // Parse and ensure createdAt is a Date object
  const agents = JSON.parse(agentsJson);
  return agents.map((agent: any) => ({
    ...agent,
    createdAt: new Date(agent.createdAt)
  }));
};

export const updateAgent = (updatedAgent: Agent): void => {
  const agents = getAgents();
  const index = agents.findIndex(agent => agent.id === updatedAgent.id);
  
  if (index !== -1) {
    agents[index] = updatedAgent;
    localStorage.setItem('agents', JSON.stringify(agents));
  }
};

export const getAgentById = (id: string): Agent | undefined => {
  const agents = getAgents();
  return agents.find(agent => agent.id === id);
};

export const deleteAgent = (id: string): void => {
  const agents = getAgents();
  const filteredAgents = agents.filter(agent => agent.id !== id);
  localStorage.setItem('agents', JSON.stringify(filteredAgents));
  // Dispatch custom event to notify other components
  window.dispatchEvent(new Event('agentsUpdated'));
};

// Helper function to generate example messages based on agent persona
export const getAgentWelcomeMessage = (agent: Agent): string => {
  const templates = [
    `Hi there! I'm ${agent.name}. How can I assist you today?`,
    `Hello! I'm ${agent.name}, an AI assistant designed to help with your questions.`,
    `Welcome! My name is ${agent.name}. What can I help you with?`,
    `Hi, How can we help you?`
  ];
  
  // Select a random template or use the first one
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
};
