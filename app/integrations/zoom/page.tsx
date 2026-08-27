"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Video,
  Shield,
  Clock,
  Plus,
  Link2,
  Unlink,
  RefreshCw,
  Play,
  History,
  Settings,
  Calendar,
  Lock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

type ConnectionState =
  | "not_connected"
  | "connecting"
  | "awaiting_authorization"
  | "connected"
  | "expired"
  | "revoked"
  | "error"
  | "reconnect_required";

interface MeetingHistory {
  id: string;
  title: string;
  status: "ended" | "cancelled";
  duration: number;
  date: string;
  recordingAvailable: boolean;
}

export default function ZoomIntegrationPage() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("not_connected");
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [connectionDate, setConnectionDate] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [meetingDateTime, setMeetingDateTime] = useState("");

  const [defaultDuration, setDefaultDuration] = useState(30);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [autoRecording, setAutoRecording] = useState(false);
  const [requirePasscode, setRequirePasscode] = useState(true);

  const [meetings] = useState<MeetingHistory[]>([
    {
      id: "1",
      title: "Physics Online Review",
      status: "ended",
      duration: 45,
      date: "2026-08-20T14:00:00",
      recordingAvailable: true,
    },
    {
      id: "2",
      title: "Mathematics Office Hours",
      status: "ended",
      duration: 60,
      date: "2026-08-18T10:30:00",
      recordingAvailable: false,
    },
    {
      id: "3",
      title: "Study Group",
      status: "ended",
      duration: 90,
      date: "2026-08-15T16:00:00",
      recordingAvailable: false,
    },
  ]);

  const getConnectionBadge = () => {
    const config: Record<ConnectionState, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      not_connected: { label: "Not Connected", variant: "secondary" },
      connecting: { label: "Connecting...", variant: "default" },
      awaiting_authorization: { label: "Awaiting Authorization", variant: "outline" },
      connected: { label: "Connected", variant: "default" },
      expired: { label: "Token Expired", variant: "destructive" },
      revoked: { label: "Access Revoked", variant: "destructive" },
      error: { label: "Connection Error", variant: "destructive" },
      reconnect_required: { label: "Reconnect Required", variant: "outline" },
    };
    const { label, variant } = config[connectionState];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleConnect = () => {
    setConnectionState("connecting");
    setTimeout(() => {
      setConnectionState("awaiting_authorization");
      setTimeout(() => {
        setConnectionState("connected");
        setConnectedEmail("instructor@zynvera.edu");
        setConnectionDate(new Date().toISOString());
        const exp = new Date();
        exp.setDate(exp.getDate() + 60);
        setExpiryDate(exp.toISOString());
      }, 2000);
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnectionState("not_connected");
    setConnectedEmail(null);
    setConnectionDate(null);
    setExpiryDate(null);
  };

  const handleReconnect = () => {
    setConnectionState("connecting");
    setTimeout(() => {
      setConnectionState("connected");
      setConnectionDate(new Date().toISOString());
    }, 1500);
  };

  const handleCreateMeeting = () => {
    if (!meetingTitle.trim()) return;
    setMeetingTitle("");
    setMeetingDuration(30);
    setMeetingDateTime("");
  };

  const formatDuration = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min} min`);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
                Z
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Zoom Integration</h1>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Connect your Zoom account to schedule and manage video conferences, online classes, and virtual office hours
              directly from Zynvera.
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Connection Status</CardTitle>
            </div>
            <CardDescription>Manage your Zoom account connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-2xl">
                  Z
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Zoom</span>
                    {getConnectionBadge()}
                  </div>
                  {connectedEmail && (
                    <p className="text-sm text-muted-foreground">{connectedEmail}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {connectionState === "not_connected" || connectionState === "expired" || connectionState === "revoked" || connectionState === "error" ? (
                  <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                ) : connectionState === "connected" ? (
                  <>
                    <Button onClick={handleReconnect} variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reconnect
                    </Button>
                    <Button onClick={handleDisconnect} variant="destructive">
                      <Unlink className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </>
                ) : connectionState === "connecting" ? (
                  <Button disabled>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </Button>
                ) : connectionState === "awaiting_authorization" || connectionState === "reconnect_required" ? (
                  <Button disabled variant="outline">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Awaiting Authorization
                  </Button>
                ) : null}
              </div>
            </div>

            {connectionDate && expiryDate && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Connected
                  </div>
                  <p className="mt-1 font-medium">{formatDate(connectionDate)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Token Expires
                  </div>
                  <p className="mt-1 font-medium">{formatDate(expiryDate)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* OAuth Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle>OAuth Authorization Info</CardTitle>
              </div>
              <CardDescription>How Zoom authorization works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                <p className="text-sm">
                  Zoom uses <span className="font-semibold">OAuth 2.0</span> for secure authorization. This ensures your
                  Zoom credentials are never stored on Zynvera servers.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Requested Scopes</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">meeting:write</Badge>
                  <Badge variant="secondary">meeting:read</Badge>
                  <Badge variant="secondary">user:read</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Token Lifecycle</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Access tokens expire after 60 days</li>
                  <li>• Refresh tokens are used to obtain new access tokens</li>
                  <li>• Tokens are automatically rotated for security</li>
                  <li>• You can revoke access at any time</li>
                </ul>
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                <div className="flex gap-2">
                  <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm">
                    <span className="font-semibold">Security Note:</span> Never expose your OAuth credentials or API keys.
                    All authorization is handled through Zoom&apos;s secure OAuth flow.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Meeting Settings</CardTitle>
              </div>
              <CardDescription>Configure default settings for new meetings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-duration">Default Meeting Duration</Label>
                <select
                  id="default-duration"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                  className="flex h-10 w-full rounded-xl neo-inset bg-background px-3 py-2 text-sm  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="waiting-room">Waiting Room</Label>
                  <p className="text-sm text-muted-foreground">Require participants to wait before joining</p>
                </div>
                <Switch id="waiting-room" checked={waitingRoom} onCheckedChange={setWaitingRoom} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-recording">Auto Recording</Label>
                  <p className="text-sm text-muted-foreground">Automatically record meetings to the cloud</p>
                </div>
                <Switch id="auto-recording" checked={autoRecording} onCheckedChange={setAutoRecording} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-passcode">Require Passcode</Label>
                  <p className="text-sm text-muted-foreground">Add a passcode for meeting security</p>
                </div>
                <Switch id="require-passcode" checked={requirePasscode} onCheckedChange={setRequirePasscode} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Meeting */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Create Zoom Meeting</CardTitle>
            </div>
            <CardDescription>Schedule a new Zoom meeting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">Meeting Title</Label>
                <input
                  id="meeting-title"
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g., Physics Review Session"
                  className="flex h-10 w-full rounded-xl neo-inset bg-background px-3 py-2 text-sm  placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-duration">Duration</Label>
                <select
                  id="meeting-duration"
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(Number(e.target.value))}
                  className="flex h-10 w-full rounded-xl neo-inset bg-background px-3 py-2 text-sm  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-datetime">Date &amp; Time</Label>
                <input
                  id="meeting-datetime"
                  type="datetime-local"
                  value={meetingDateTime}
                  onChange={(e) => setMeetingDateTime(e.target.value)}
                  className="flex h-10 w-full rounded-xl neo-inset bg-background px-3 py-2 text-sm  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleCreateMeeting}
                  disabled={!meetingTitle.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Create Meeting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meeting History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Meeting History</CardTitle>
            </div>
            <CardDescription>Your recent Zoom meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Video className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{meeting.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {meeting.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(meeting.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(meeting.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4">
                    {meeting.recordingAvailable ? (
                      <Button variant="outline" size="sm">
                        <Play className="mr-1 h-3 w-3" />
                        Recording
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No recording</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
