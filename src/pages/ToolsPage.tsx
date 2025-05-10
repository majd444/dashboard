import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

export default function ToolsPage() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    // Check if user is authenticated
    console.log("Checking authentication status...");
    fetch("/api/auth/status")
      .then((res) => {
        console.log("Auth status response:", res.status);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Auth status data:", data);
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          fetchEvents();
        } else {
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Failed to check auth status:", error);
        setStatusError(`Failed to check authentication: ${error.message}`);
        setIsLoading(false);
      });
  }, []);

  const fetchEvents = async () => {
    try {
      console.log("Fetching calendar events...");
      const response = await fetch("/api/calendar/events");
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      const data = await response.json();
      console.log("Calendar events:", data);
      setEvents(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    console.log("Connecting to Google...");
    // Use full URL to avoid proxy issues
    window.location.href = "http://localhost:4201/auth/google";
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsSending(true);

    try {
      console.log("Sending email...");
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: recipient, subject, message }),
      });

      console.log("Email response status:", response.status);
      const result = await response.json();
      console.log("Email result:", result);

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "Your email was sent successfully.",
        });
        // Reset form
        setRecipient("");
        setSubject("");
        setMessage("");
      } else {
        toast({
          variant: "destructive",
          title: "Failed to send email",
          description: result.error || "An unknown error occurred.",
        });
      }
    } catch (error) {
      console.error("Email error:", error);
      toast({
        variant: "destructive",
        title: "Failed to send email",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Communication Tools</h1>
      
      {statusError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{statusError}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="text-blue-500">
                <Calendar size={24} />
              </div>
              <CardTitle>Google Calendar</CardTitle>
            </div>
            <CardDescription>Check calendar and manage appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <>
                <p className="mb-4">Connect your Google account to enable calendar functionality.</p>
                <Button onClick={handleConnect}>Connect</Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Your Upcoming Events</h3>
                {isLoading ? (
                  <p>Loading events...</p>
                ) : events.length === 0 ? (
                  <p>No upcoming events found.</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => {
                      const start = new Date(event.start.dateTime || event.start.date);
                      return (
                        <div 
                          key={event.id} 
                          className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded"
                        >
                          <div className="font-medium">{event.summary}</div>
                          <div className="text-sm text-gray-600">
                            {start.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="text-green-500">
                <Mail size={24} />
              </div>
              <CardTitle>Email</CardTitle>
            </div>
            <CardDescription>Send emails through your Google account</CardDescription>
          </CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <>
                <p className="mb-4">Connect your Google account to enable email functionality.</p>
                <Button onClick={handleConnect}>Connect</Button>
              </>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="recipient">
                    Recipient Email
                  </label>
                  <Input
                    id="recipient"
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="subject">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="Email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="message">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Type your email message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="min-h-32"
                  />
                </div>
                
                <Button type="submit" disabled={isSending}>
                  {isSending ? "Sending..." : "Send Email"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>Authentication Status: {isAuthenticated ? "Authenticated" : "Not Authenticated"}</p>
        <p>Loading State: {isLoading ? "Loading" : "Not Loading"}</p>
        <p>Events Count: {events.length}</p>
      </div>
    </div>
  );
} 