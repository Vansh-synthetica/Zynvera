"use client";

import { useState, useEffect, useCallback, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  File,
  X,
  AlertCircle,
  ArrowRight,
  Shield,
  LogOut,
  RotateCcw,
  Check,
  Clock,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";

type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

type UserRole = "student" | "teacher";

interface TeacherData {
  institutionEmail: string;
  employeeId: string;
  department: string;
  position: string;
  employmentLetter: File | null;
  degreeCertificate: File | null;
}

interface StudentData {
  institutionEmail: string;
  studentId: string;
  programme: string;
  yearOfStudy: string;
  enrolmentProof: File | null;
  governmentId: File | null;
}

interface VerificationData {
  status: VerificationStatus;
  role: UserRole;
  submittedAt: string;
  rejectionReason?: string;
  teacherData?: TeacherData;
  studentData?: StudentData;
  documents: string[];
}

const STORAGE_KEY = "zynvera_verification";

function getStoredVerification(): VerificationData | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      parsed.teacherData = { ...parsed.teacherData, employmentLetter: null, degreeCertificate: null };
      parsed.studentData = { ...parsed.studentData, enrolmentProof: null, governmentId: null };
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function storeVerification(data: VerificationData) {
  const serializable = {
    ...data,
    teacherData: data.teacherData
      ? { ...data.teacherData, employmentLetter: null, degreeCertificate: null }
      : undefined,
    studentData: data.studentData
      ? { ...data.studentData, enrolmentProof: null, governmentId: null }
      : undefined,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

function clearVerification() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function VerificationPage() {
  const { setVerificationStatus } = useWorkspace();

  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [status, setStatus] = useState<VerificationStatus>("unverified");
  const [role, setRole] = useState<UserRole>("student");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [teacherData, setTeacherData] = useState<TeacherData>({
    institutionEmail: "",
    employeeId: "",
    department: "",
    position: "",
    employmentLetter: null,
    degreeCertificate: null,
  });

  const [studentData, setStudentData] = useState<StudentData>({
    institutionEmail: "",
    studentId: "",
    programme: "",
    yearOfStudy: "",
    enrolmentProof: null,
    governmentId: null,
  });

  useEffect(() => {
    const stored = getStoredVerification();
    if (stored) {
      setVerification(stored);
      setStatus(stored.status);
      setRole(stored.role);
      if (stored.teacherData) {
        setTeacherData((prev) => ({ ...prev, ...stored.teacherData }));
      }
      if (stored.studentData) {
        setStudentData((prev) => ({ ...prev, ...stored.studentData }));
      }
    }
  }, []);

  useEffect(() => {
    setVerificationStatus(status);
  }, [status, setVerificationStatus]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmitVerification = () => {
    const isTeacher = role === "teacher";
    const data = isTeacher ? teacherData : studentData;

    const verificationData: VerificationData = {
      status: "pending",
      role,
      submittedAt: new Date().toISOString(),
      teacherData: isTeacher ? teacherData : undefined,
      studentData: !isTeacher ? studentData : undefined,
      documents: fileNames,
    };

    storeVerification(verificationData);
    setVerification(verificationData);
    setStatus("pending");
  };

  const handleSignOut = () => {
    clearVerification();
    setVerification(null);
    setStatus("unverified");
    setUploadedFiles([]);
  };

  const handleResubmit = () => {
    clearVerification();
    setVerification(null);
    setStatus("unverified");
    setUploadedFiles([]);
  };

  const progressSteps = [
    { label: "Upload", icon: Upload, done: status === "pending" || status === "verified" },
    { label: "Review", icon: FileCheck, done: status === "verified" },
    { label: "Access", icon: CheckCircle2, done: false },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-2xl neo border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight tracking-tight">Zynvera</span>
          </div>
          <CardTitle className="text-2xl font-bold">Account Verification</CardTitle>
          <CardDescription>
            Verify your identity to access the full platform
          </CardDescription>

          <div className="flex items-center justify-center gap-2 pt-2">
            {progressSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === 0 && (status === "unverified" || status === "rejected");
              const isPending = index === 1 && status === "pending";
              const isComplete = step.done;

              return (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isComplete
                          ? "bg-green-500 text-white"
                          : isPending
                            ? "bg-primary/20 text-primary animate-pulse"
                            : isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-4 h-4" />
                      ) : isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
                  </div>
                  {index < progressSteps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mb-5 ${
                        isComplete ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* UNVERIFIED / REJECTED STATE */}
          {(status === "unverified" || status === "rejected") && (
            <div className="space-y-6">
              {status === "rejected" && verification?.rejectionReason && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-destructive text-sm">Verification Rejected</p>
                    <p className="text-sm text-muted-foreground">{verification.rejectionReason}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">I am a</label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as UserRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher / Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* TEACHER FORM */}
              {role === "teacher" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Teacher Verification
                    </span>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Institution Email <span className="text-muted-foreground text-xs">(optional)</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="professor@university.edu"
                        value={teacherData.institutionEmail}
                        onChange={(e) =>
                          setTeacherData((prev) => ({ ...prev, institutionEmail: e.target.value }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Employee ID</label>
                        <Input
                          placeholder="EMP-12345"
                          value={teacherData.employeeId}
                          onChange={(e) =>
                            setTeacherData((prev) => ({ ...prev, employeeId: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Department</label>
                        <Input
                          placeholder="Computer Science"
                          value={teacherData.department}
                          onChange={(e) =>
                            setTeacherData((prev) => ({ ...prev, department: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Position / Title</label>
                      <Input
                        placeholder="Associate Professor"
                        value={teacherData.position}
                        onChange={(e) =>
                          setTeacherData((prev) => ({ ...prev, position: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Required Documents</p>

                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("employment-letter")?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Employment Letter <span className="text-destructive">*</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Drag & drop or click to browse
                      </p>
                      <input
                        id="employment-letter"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                      />
                    </div>

                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("degree-certificate")?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Degree Certificate (Optional)</p>
                      <p className="text-xs text-muted-foreground">
                        Drag & drop or click to browse
                      </p>
                      <input
                        id="degree-certificate"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STUDENT FORM */}
              {role === "student" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Student Verification
                    </span>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Institution Email <span className="text-muted-foreground text-xs">(optional)</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="student@university.edu"
                        value={studentData.institutionEmail}
                        onChange={(e) =>
                          setStudentData((prev) => ({
                            ...prev,
                            institutionEmail: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Student ID</label>
                        <Input
                          placeholder="STU-12345"
                          value={studentData.studentId}
                          onChange={(e) =>
                            setStudentData((prev) => ({ ...prev, studentId: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Programme / Major</label>
                        <Input
                          placeholder="Software Engineering"
                          value={studentData.programme}
                          onChange={(e) =>
                            setStudentData((prev) => ({ ...prev, programme: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Year of Study</label>
                      <Select
                        value={studentData.yearOfStudy}
                        onValueChange={(v) =>
                          setStudentData((prev) => ({ ...prev, yearOfStudy: v }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                          <SelectItem value="5">5th Year</SelectItem>
                          <SelectItem value="6">Graduate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Required Documents</p>

                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("enrolment-proof")?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Enrolment Proof <span className="text-destructive">*</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Drag & drop or click to browse
                      </p>
                      <input
                        id="enrolment-proof"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                      />
                    </div>

                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("government-id")?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Government ID (Optional)</p>
                      <p className="text-xs text-muted-foreground">
                        Drag & drop or click to browse
                      </p>
                      <input
                        id="government-id"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOADED FILES LIST */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Files</p>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmitVerification}
              >
                Submit Verification
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* PENDING STATE */}
          {status === "pending" && (
            <div className="space-y-6 py-8 text-center">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Your verification is being reviewed</h3>
                <p className="text-muted-foreground">
                  Our team is reviewing your submitted documents.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Estimated time: 24-48 hours</span>
              </div>

              <p className="text-sm text-muted-foreground">
                We&apos;ll notify you once your account has been approved.
              </p>

              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}

          {/* VERIFIED STATE */}
          {status === "verified" && (
            <div className="space-y-6 py-8 text-center">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-green-600">
                  Your account has been verified!
                </h3>
                <p className="text-muted-foreground">
                  You now have full access to the platform.
                </p>
              </div>

              <Link href="/dashboard">
                <Button size="lg" className="px-8">
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}

          {/* REJECTED STATE - Resubmit link */}
          {status === "rejected" && (
            <div className="pt-2">
              <Separator className="mb-4" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                Please update your documents and resubmit.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResubmit}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resubmit Verification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
