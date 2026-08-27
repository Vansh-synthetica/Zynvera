"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChartIcon as Pie,
  Target,
  Star,
  Brain,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Zap,
  Activity,
  DollarSign,
  Shield,
  Award,
  MessageSquare,
  Settings,
  Filter,
  Eye,
  RefreshCw,
  Headphones,
  Monitor,
  Building,
  Briefcase,
  Calculator,
  Server,
  Gauge,
} from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function AnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("semester")
  const [selectedGrade, setSelectedGrade] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMetric, setSelectedMetric] = useState("performance")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [realTimeData, setRealTimeData] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedDashboard, setSelectedDashboard] = useState("executive")

  const handleComingSoon = (feature: string) => {
    alert(`${feature} - Coming Soon! 🚀\n\nWe're building advanced analytics features. Stay tuned!`)
  }

  // Enterprise-level data structures
  const executiveMetrics = {
    totalRevenue: 2847000,
    monthlyRecurring: 284700,
    studentRetention: 94.2,
    teacherSatisfaction: 87.5,
    parentSatisfaction: 91.3,
    operationalEfficiency: 89.7,
    costPerStudent: 1250,
    profitMargin: 23.4,
    growthRate: 12.3,
    marketShare: 8.7,
  }

  const financialMetrics = {
    tuitionRevenue: 2100000,
    additionalFees: 420000,
    governmentFunding: 327000,
    totalExpenses: 2180000,
    teacherSalaries: 1308000,
    infrastructure: 436000,
    technology: 218000,
    marketing: 109000,
    administration: 109000,
    netProfit: 667000,
    cashFlow: 890000,
    budgetVariance: -2.3,
  }

  const operationalMetrics = {
    classUtilization: 87.3,
    teacherWorkload: 92.1,
    resourceEfficiency: 84.6,
    systemUptime: 99.7,
    supportTickets: 23,
    avgResolutionTime: 2.4,
    studentEngagement: 88.9,
    contentCompletion: 91.2,
    assessmentScores: 85.7,
    parentCommunication: 76.8,
  }

  const predictiveInsights = [
    {
      type: "enrollment",
      prediction: "15% increase expected next semester",
      confidence: 87,
      impact: "high",
      recommendation: "Prepare additional classroom capacity",
      timeline: "Next 3 months",
    },
    {
      type: "retention",
      prediction: "3 students at risk of dropping out",
      confidence: 92,
      impact: "medium",
      recommendation: "Implement targeted intervention programs",
      timeline: "Immediate action required",
    },
    {
      type: "performance",
      prediction: "Math scores likely to improve by 8%",
      confidence: 78,
      impact: "high",
      recommendation: "Continue current teaching methodology",
      timeline: "End of semester",
    },
    {
      type: "financial",
      prediction: "Revenue shortfall of $45K possible",
      confidence: 83,
      impact: "high",
      recommendation: "Review pricing strategy and cost optimization",
      timeline: "Next quarter",
    },
  ]

  const competitorAnalysis = [
    {
      school: "Riverside Academy",
      marketShare: 12.3,
      avgTuition: 15000,
      studentCount: 1200,
      satisfaction: 89.2,
      strengths: ["Technology", "Sports Programs"],
      weaknesses: ["Class Size", "Teacher Retention"],
    },
    {
      school: "Oakwood Prep",
      marketShare: 9.8,
      avgTuition: 18000,
      studentCount: 950,
      satisfaction: 91.5,
      strengths: ["Academic Excellence", "Small Classes"],
      weaknesses: ["Limited Facilities", "High Costs"],
    },
    {
      school: "Metro High School",
      marketShare: 15.7,
      avgTuition: 12000,
      studentCount: 1800,
      satisfaction: 84.3,
      strengths: ["Affordability", "Large Programs"],
      weaknesses: ["Overcrowding", "Limited Resources"],
    },
  ]

  const riskAssessment = [
    {
      category: "Financial",
      risk: "Budget Overrun",
      probability: "Medium",
      impact: "High",
      mitigation: "Implement stricter budget controls",
      status: "Monitoring",
      owner: "CFO",
    },
    {
      category: "Operational",
      risk: "Teacher Shortage",
      probability: "High",
      impact: "High",
      mitigation: "Increase recruitment efforts and retention programs",
      status: "Active",
      owner: "HR Director",
    },
    {
      category: "Technology",
      risk: "System Downtime",
      probability: "Low",
      impact: "Medium",
      mitigation: "Redundant systems and regular maintenance",
      status: "Controlled",
      owner: "IT Manager",
    },
    {
      category: "Regulatory",
      risk: "Compliance Issues",
      probability: "Low",
      impact: "High",
      mitigation: "Regular audits and staff training",
      status: "Controlled",
      owner: "Compliance Officer",
    },
  ]

  const parentEngagement = {
    communicationFrequency: 78.5,
    eventAttendance: 65.2,
    volunteerParticipation: 42.8,
    feedbackResponse: 71.3,
    satisfactionScore: 91.3,
    complaintResolution: 94.7,
  }

  const teacherMetrics = {
    totalTeachers: 89,
    fullTime: 67,
    partTime: 22,
    avgExperience: 8.3,
    retention: 92.1,
    satisfaction: 87.5,
    performanceRating: 4.2,
    professionalDevelopment: 76.4,
    workloadBalance: 3.8,
    salaryCompetitiveness: 4.1,
  }

  const technologyMetrics = {
    systemUptime: 99.7,
    avgLoadTime: 1.2,
    userSatisfaction: 88.9,
    mobileUsage: 67.3,
    featureAdoption: 84.2,
    supportTickets: 23,
    securityIncidents: 0,
    dataBackupSuccess: 100,
    cloudStorage: 78.5,
    bandwidth: 95.2,
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-16 min-h-screen bg-gradient-to-br from-white to-stone-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Enhanced Header with Real-time Status */}
          <div className="flex items-center justify-between mb-8 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <Link href="/school-dashboard">
                <Button variant="ghost" size="sm" className="rounded-full hover:scale-105 transition-all duration-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-light tracking-tight text-gray-900">
                  Enterprise Analytics Suite
                  <Badge className="ml-3 bg-green-100 text-green-800">Live</Badge>
                </h1>
                <p className="text-gray-500 mt-2 flex items-center gap-4">
                  <span>Real-time insights for data-driven decisions</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm">System Status: Operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Last Updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setAutoRefresh(!autoRefresh)}>
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                Auto-Refresh: {autoRefresh ? "On" : "Off"}
              </Button>
              <Button
                variant="outline"
                className="rounded-full hover:scale-105 transition-all duration-300"
                onClick={() => handleComingSoon("Export Comprehensive Report")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button
                variant="outline"
                className="rounded-full hover:scale-105 transition-all duration-300"
                onClick={() => handleComingSoon("Schedule Report")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full hover:scale-105 transition-all duration-300"
                onClick={() => handleComingSoon("AI Insights")}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
              </Button>
            </div>
          </div>

          {/* Executive Dashboard Selector */}
          <Card className="border-0 neo-sm mb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Dashboard View</h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleComingSoon("Customize Dashboard")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { id: "executive", label: "Executive", icon: Briefcase },
                    { id: "financial", label: "Financial", icon: DollarSign },
                    { id: "operational", label: "Operational", icon: Settings },
                    { id: "academic", label: "Academic", icon: GraduationCap },
                    { id: "predictive", label: "Predictive", icon: Brain },
                  ].map((dashboard) => {
                    const Icon = dashboard.icon
                    return (
                      <Button
                        key={dashboard.id}
                        size="sm"
                        variant={selectedDashboard === dashboard.id ? "default" : "ghost"}
                        className="rounded-xl text-xs flex items-center gap-2"
                        onClick={() => setSelectedDashboard(dashboard.id)}
                      >
                        <Icon className="h-4 w-4" />
                        {dashboard.label}
                      </Button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm font-medium text-gray-700">Timeframe:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {["live", "day", "week", "month", "quarter", "year"].map((period) => (
                      <Button
                        key={period}
                        size="sm"
                        variant={selectedTimeframe === period ? "default" : "ghost"}
                        className="rounded-xl text-xs capitalize"
                        onClick={() => setSelectedTimeframe(period)}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg animate-fade-in-up">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Grade Level</label>
                      <div className="flex flex-wrap gap-1">
                        {["All", "9", "10", "11", "12"].map((grade) => (
                          <Button
                            key={grade}
                            size="sm"
                            variant={selectedGrade === grade.toLowerCase() ? "default" : "outline"}
                            className="text-xs"
                            onClick={() => setSelectedGrade(grade.toLowerCase())}
                          >
                            {grade}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Subject Area</label>
                      <div className="flex flex-wrap gap-1">
                        {["All", "STEM", "Arts", "Languages", "Sports"].map((subject) => (
                          <Button
                            key={subject}
                            size="sm"
                            variant={selectedSubject === subject.toLowerCase() ? "default" : "outline"}
                            className="text-xs"
                            onClick={() => setSelectedSubject(subject.toLowerCase())}
                          >
                            {subject}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Performance Metric</label>
                      <div className="flex flex-wrap gap-1">
                        {["Performance", "Engagement", "Attendance", "Satisfaction"].map((metric) => (
                          <Button
                            key={metric}
                            size="sm"
                            variant={selectedMetric === metric.toLowerCase() ? "default" : "outline"}
                            className="text-xs"
                            onClick={() => setSelectedMetric(metric.toLowerCase())}
                          >
                            {metric}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Search Students</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search by name, ID, or class..."
                          className="pl-10 text-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-7 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg">
                Overview
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-lg">
                Students
              </TabsTrigger>
              <TabsTrigger value="teachers" className="rounded-lg">
                Teachers
              </TabsTrigger>
              <TabsTrigger value="parents" className="rounded-lg">
                Parents
              </TabsTrigger>
              <TabsTrigger value="finance" className="rounded-lg">
                Finance
              </TabsTrigger>
              <TabsTrigger value="operations" className="rounded-lg">
                Operations
              </TabsTrigger>
              <TabsTrigger value="insights" className="rounded-lg">
                AI Insights
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Executive KPI Dashboard */}
              {selectedDashboard === "executive" && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {[
                    {
                      title: "Total Revenue",
                      value: `$${(executiveMetrics.totalRevenue / 1000000).toFixed(2)}M`,
                      change: `+${executiveMetrics.growthRate}% YoY`,
                      icon: DollarSign,
                      color: "from-green-500 to-emerald-500",
                      trend: "up",
                    },
                    {
                      title: "Student Retention",
                      value: `${executiveMetrics.studentRetention}%`,
                      change: "+2.1% improvement",
                      icon: Users,
                      color: "from-blue-500 to-cyan-500",
                      trend: "up",
                    },
                    {
                      title: "Teacher Satisfaction",
                      value: `${executiveMetrics.teacherSatisfaction}%`,
                      change: "+5.2% improvement",
                      icon: Star,
                      color: "from-purple-500 to-pink-500",
                      trend: "up",
                    },
                    {
                      title: "Operational Efficiency",
                      value: `${executiveMetrics.operationalEfficiency}%`,
                      change: "+3.1% improvement",
                      icon: Gauge,
                      color: "from-orange-500 to-red-500",
                      trend: "up",
                    },
                    {
                      title: "Market Share",
                      value: `${executiveMetrics.marketShare}%`,
                      change: "+1.2% growth",
                      icon: Target,
                      color: "from-indigo-500 to-purple-500",
                      trend: "up",
                    },
                  ].map((metric, index) => {
                    const Icon = metric.icon
                    return (
                      <Card
                        key={index}
                        className="border-0 neo-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105 animate-fade-in-up relative overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => handleComingSoon(`${metric.title} Deep Dive`)}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                        />
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div
                              className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                            >
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-light mb-1">{metric.value}</div>
                              <div className="text-xs text-gray-600 font-medium">{metric.title}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {metric.change}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Live
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Financial Dashboard */}
              {selectedDashboard === "financial" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 border-0 neo-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Revenue Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {[
                          {
                            source: "Tuition Revenue",
                            amount: financialMetrics.tuitionRevenue,
                            percentage: 74,
                            color: "from-green-500 to-emerald-500",
                          },
                          {
                            source: "Additional Fees",
                            amount: financialMetrics.additionalFees,
                            percentage: 15,
                            color: "from-blue-500 to-cyan-500",
                          },
                          {
                            source: "Government Funding",
                            amount: financialMetrics.governmentFunding,
                            percentage: 11,
                            color: "from-purple-500 to-pink-500",
                          },
                        ].map((revenue, index) => (
                          <div key={index} className="cursor-pointer hover:scale-105 transition-transform duration-300">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{revenue.source}</span>
                              <div className="text-right">
                                <span className="font-medium">${(revenue.amount / 1000).toFixed(0)}K</span>
                                <span className="text-sm text-gray-500 ml-2">({revenue.percentage}%)</span>
                              </div>
                            </div>
                            <div className="relative">
                              <Progress value={revenue.percentage} className="h-3" />
                              <div
                                className={`absolute inset-0 bg-gradient-to-r ${revenue.color} rounded-full opacity-20`}
                                style={{ width: `${revenue.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card className="border-0 neo-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">Financial Health</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Net Profit</span>
                            <span className="font-medium text-green-600">
                              ${(financialMetrics.netProfit / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Cash Flow</span>
                            <span className="font-medium text-blue-600">
                              ${(financialMetrics.cashFlow / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Budget Variance</span>
                            <span className="font-medium text-red-600">{financialMetrics.budgetVariance}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Cost per Student</span>
                            <span className="font-medium">${executiveMetrics.costPerStudent}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 neo-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">Expense Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            {
                              category: "Teacher Salaries",
                              amount: financialMetrics.teacherSalaries,
                              color: "bg-blue-500",
                            },
                            {
                              category: "Infrastructure",
                              amount: financialMetrics.infrastructure,
                              color: "bg-green-500",
                            },
                            { category: "Technology", amount: financialMetrics.technology, color: "bg-purple-500" },
                            { category: "Marketing", amount: financialMetrics.marketing, color: "bg-orange-500" },
                            {
                              category: "Administration",
                              amount: financialMetrics.administration,
                              color: "bg-red-500",
                            },
                          ].map((expense, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 ${expense.color} rounded-full`} />
                                <span className="text-sm">{expense.category}</span>
                              </div>
                              <span className="text-sm font-medium">${(expense.amount / 1000).toFixed(0)}K</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Predictive Analytics Dashboard */}
              {selectedDashboard === "predictive" && (
                <div className="space-y-8">
                  <Card className="border-0 neo-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        AI-Powered Predictions & Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {predictiveInsights.map((insight, index) => (
                          <div
                            key={index}
                            className={`p-6 rounded-lg border-2 cursor-pointer hover:scale-105 transition-all duration-300 ${
                              insight.impact === "high"
                                ? "border-red-200 bg-red-50"
                                : insight.impact === "medium"
                                  ? "border-yellow-200 bg-yellow-50"
                                  : "border-green-200 bg-green-50"
                            }`}
                            onClick={() => handleComingSoon(`${insight.type} Prediction Details`)}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <Badge
                                className={
                                  insight.impact === "high"
                                    ? "bg-red-100 text-red-800"
                                    : insight.impact === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                }
                              >
                                {insight.type.toUpperCase()}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{insight.confidence}% confidence</span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full">
                                  <div
                                    className="h-2 bg-blue-500 rounded-full"
                                    style={{ width: `${insight.confidence}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <h3 className="font-medium text-lg mb-2">{insight.prediction}</h3>
                            <p className="text-sm text-gray-600 mb-4">{insight.recommendation}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{insight.timeline}</span>
                              <Button size="sm" variant="outline" className="text-xs">
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Assessment Matrix */}
                  <Card className="border-0 neo-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Shield className="h-5 w-5 text-orange-600" />
                        Risk Assessment Matrix
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3">Risk Category</th>
                              <th className="text-left p-3">Risk Description</th>
                              <th className="text-left p-3">Probability</th>
                              <th className="text-left p-3">Impact</th>
                              <th className="text-left p-3">Mitigation</th>
                              <th className="text-left p-3">Status</th>
                              <th className="text-left p-3">Owner</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riskAssessment.map((risk, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50 cursor-pointer">
                                <td className="p-3">
                                  <Badge variant="outline">{risk.category}</Badge>
                                </td>
                                <td className="p-3 font-medium">{risk.risk}</td>
                                <td className="p-3">
                                  <Badge
                                    className={
                                      risk.probability === "High"
                                        ? "bg-red-100 text-red-800"
                                        : risk.probability === "Medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                    }
                                  >
                                    {risk.probability}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  <Badge
                                    className={
                                      risk.impact === "High"
                                        ? "bg-red-100 text-red-800"
                                        : risk.impact === "Medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                    }
                                  >
                                    {risk.impact}
                                  </Badge>
                                </td>
                                <td className="p-3 text-sm">{risk.mitigation}</td>
                                <td className="p-3">
                                  <Badge
                                    className={
                                      risk.status === "Active"
                                        ? "bg-red-100 text-red-800"
                                        : risk.status === "Monitoring"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                    }
                                  >
                                    {risk.status}
                                  </Badge>
                                </td>
                                <td className="p-3 text-sm">{risk.owner}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Competitor Analysis */}
              <Card className="border-0 neo-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Competitive Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">School</th>
                          <th className="text-left p-3">Market Share</th>
                          <th className="text-left p-3">Avg. Tuition</th>
                          <th className="text-left p-3">Students</th>
                          <th className="text-left p-3">Satisfaction</th>
                          <th className="text-left p-3">Strengths</th>
                          <th className="text-left p-3">Weaknesses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competitorAnalysis.map((competitor, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 cursor-pointer">
                            <td className="p-3 font-medium">{competitor.school}</td>
                            <td className="p-3">{competitor.marketShare}%</td>
                            <td className="p-3">${competitor.avgTuition.toLocaleString()}</td>
                            <td className="p-3">{competitor.studentCount.toLocaleString()}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span>{competitor.satisfaction}%</span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full">
                                  <div
                                    className="h-2 bg-green-500 rounded-full"
                                    style={{ width: `${competitor.satisfaction}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {competitor.strengths.map((strength, i) => (
                                  <Badge key={i} className="bg-green-100 text-green-800 text-xs">
                                    {strength}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {competitor.weaknesses.map((weakness, i) => (
                                  <Badge key={i} className="bg-red-100 text-red-800 text-xs">
                                    {weakness}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Tab - Enhanced */}
            <TabsContent value="students" className="space-y-8">
              {/* Student Overview Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: "Total Enrolled",
                    value: "2,847",
                    change: "+156 this semester",
                    icon: Users,
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    title: "Average GPA",
                    value: "3.42",
                    change: "+0.15 improvement",
                    icon: GraduationCap,
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    title: "Attendance Rate",
                    value: "94.2%",
                    change: "+2.1% improvement",
                    icon: Clock,
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    title: "Graduation Rate",
                    value: "96.8%",
                    change: "+1.3% improvement",
                    icon: Award,
                    color: "from-orange-500 to-red-500",
                  },
                ].map((metric, index) => {
                  const Icon = metric.icon
                  return (
                    <Card
                      key={index}
                      className="border-0 neo-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105 animate-fade-in-up relative overflow-hidden"
                      onClick={() => handleComingSoon(`${metric.title} Details`)}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                      />
                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-2xl font-light mb-1">{metric.value}</div>
                            <div className="text-xs text-gray-600 font-medium">{metric.title}</div>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {metric.change}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Student Performance Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-0 neo-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Performance Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { grade: "A (90-100%)", count: 684, percentage: 24, color: "from-green-500 to-emerald-500" },
                        { grade: "B (80-89%)", count: 1139, percentage: 40, color: "from-blue-500 to-cyan-500" },
                        { grade: "C (70-79%)", count: 797, percentage: 28, color: "from-yellow-500 to-orange-500" },
                        { grade: "D (60-69%)", count: 171, percentage: 6, color: "from-orange-500 to-red-500" },
                        { grade: "F (Below 60%)", count: 56, percentage: 2, color: "from-red-500 to-pink-500" },
                      ].map((grade, index) => (
                        <div
                          key={index}
                          className="cursor-pointer hover:scale-105 transition-transform duration-300"
                          onClick={() => handleComingSoon(`${grade.grade} Student List`)}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{grade.grade}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{grade.count} students</span>
                              <span className="text-sm font-medium">{grade.percentage}%</span>
                            </div>
                          </div>
                          <div className="relative">
                            <Progress value={grade.percentage} className="h-3" />
                            <div
                              className={`absolute inset-0 bg-gradient-to-r ${grade.color} rounded-full opacity-20`}
                              style={{ width: `${grade.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 neo-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Students Requiring Intervention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          category: "Academic Risk",
                          count: 23,
                          description: "GPA below 2.0",
                          color: "bg-red-500",
                          action: "Academic Support",
                        },
                        {
                          category: "Attendance Issues",
                          count: 45,
                          description: "Below 80% attendance",
                          color: "bg-orange-500",
                          action: "Attendance Monitoring",
                        },
                        {
                          category: "Behavioral Concerns",
                          count: 12,
                          description: "Multiple disciplinary actions",
                          color: "bg-yellow-500",
                          action: "Counseling Support",
                        },
                        {
                          category: "Social-Emotional",
                          count: 18,
                          description: "Mental health support needed",
                          color: "bg-purple-500",
                          action: "Wellness Program",
                        },
                      ].map((category, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                          onClick={() => handleComingSoon(`${category.category} Details`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 ${category.color} rounded-full`} />
                              <span className="font-medium">{category.category}</span>
                            </div>
                            <Badge className="bg-red-100 text-red-800">{category.count} students</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                          <Button size="sm" variant="outline" className="text-xs">
                            {category.action}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Student Search and Management */}
              <Card className="border-0 neo-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Search className="h-5 w-5 text-purple-600" />
                    Advanced Student Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Search and Filter Bar */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative flex-1 min-w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search students by name, ID, grade, or performance..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => handleComingSoon("Export Student Data")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => handleComingSoon("Bulk Actions")}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Bulk Actions
                      </Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                        onClick={() => handleComingSoon("AI Student Insights")}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        AI Insights
                      </Button>
                    </div>

                    {/* Student List with Advanced Details */}
                    <div className="space-y-4">
                      {[
                        {
                          id: "STU001",
                          name: "Emma Thompson",
                          grade: "11th",
                          gpa: 3.85,
                          attendance: 96.2,
                          status: "Excellent",
                          subjects: ["Math", "Science", "English"],
                          alerts: [],
                          parentContact: "High",
                          extracurricular: ["Debate Team", "Science Club"],
                        },
                        {
                          id: "STU002",
                          name: "Marcus Johnson",
                          grade: "10th",
                          gpa: 2.45,
                          attendance: 78.3,
                          status: "At Risk",
                          subjects: ["Math", "History", "Art"],
                          alerts: ["Low GPA", "Attendance"],
                          parentContact: "Medium",
                          extracurricular: ["Basketball"],
                        },
                        {
                          id: "STU003",
                          name: "Sophia Chen",
                          grade: "12th",
                          gpa: 4.0,
                          attendance: 98.7,
                          status: "Outstanding",
                          subjects: ["AP Math", "AP Science", "AP English"],
                          alerts: [],
                          parentContact: "High",
                          extracurricular: ["Student Council", "NHS", "Robotics"],
                        },
                        {
                          id: "STU004",
                          name: "David Rodriguez",
                          grade: "9th",
                          gpa: 3.12,
                          attendance: 89.4,
                          status: "Good",
                          subjects: ["Math", "Science", "Spanish"],
                          alerts: ["Needs Support"],
                          parentContact: "Low",
                          extracurricular: ["Soccer"],
                        },
                      ].map((student, index) => (
                        <div
                          key={index}
                          className="p-6 bg-white border border-gray-200 rounded-lg hover:neo transition-all duration-300 cursor-pointer"
                          onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <h3 className="font-medium text-lg">{student.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>ID: {student.id}</span>
                                  <span>Grade: {student.grade}</span>
                                  <span>GPA: {student.gpa}</span>
                                  <span>Attendance: {student.attendance}%</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {student.alerts.length > 0 && (
                                <div className="flex gap-1">
                                  {student.alerts.map((alert, i) => (
                                    <Badge key={i} className="bg-red-100 text-red-800 text-xs">
                                      {alert}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <Badge
                                className={
                                  student.status === "Outstanding"
                                    ? "bg-green-100 text-green-800"
                                    : student.status === "Excellent"
                                      ? "bg-blue-100 text-blue-800"
                                      : student.status === "Good"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                }
                              >
                                {student.status}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                {expandedStudent === student.id ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Student Details */}
                          {expandedStudent === student.id && (
                            <div className="mt-6 pt-6 border-t border-gray-200 animate-fade-in-up">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <h4 className="font-medium mb-3">Academic Performance</h4>
                                  <div className="space-y-2">
                                    {student.subjects.map((subject, i) => (
                                      <div key={i} className="flex justify-between items-center">
                                        <span className="text-sm">{subject}</span>
                                        <div className="flex items-center gap-2">
                                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                                            <div
                                              className="h-2 bg-blue-500 rounded-full"
                                              style={{ width: `${Math.random() * 40 + 60}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-gray-600">
                                            {(Math.random() * 1.5 + 2.5).toFixed(1)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-3">Engagement</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm">Parent Contact</span>
                                      <Badge
                                        className={
                                          student.parentContact === "High"
                                            ? "bg-green-100 text-green-800"
                                            : student.parentContact === "Medium"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                        }
                                      >
                                        {student.parentContact}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-600">Extracurricular:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {student.extracurricular.map((activity, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">
                                            {activity}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-3">Quick Actions</h4>
                                  <div className="space-y-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full justify-start"
                                      onClick={() => handleComingSoon("Send Message")}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Send Message
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full justify-start"
                                      onClick={() => handleComingSoon("Schedule Meeting")}
                                    >
                                      <Calendar className="h-4 w-4 mr-2" />
                                      Schedule Meeting
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full justify-start"
                                      onClick={() => handleComingSoon("View Full Profile")}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Full Profile
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teachers Tab */}
            <TabsContent value="teachers" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: "Total Teachers",
                    value: teacherMetrics.totalTeachers.toString(),
                    subtitle: `${teacherMetrics.fullTime} Full-time, ${teacherMetrics.partTime} Part-time`,
                    icon: Users,
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    title: "Retention Rate",
                    value: `${teacherMetrics.retention}%`,
                    subtitle: "+3.2% from last year",
                    icon: CheckCircle,
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    title: "Satisfaction Score",
                    value: `${teacherMetrics.satisfaction}%`,
                    subtitle: `${teacherMetrics.performanceRating}/5.0 performance`,
                    icon: Star,
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    title: "Avg Experience",
                    value: `${teacherMetrics.avgExperience} years`,
                    subtitle: `${teacherMetrics.professionalDevelopment}% in PD programs`,
                    icon: GraduationCap,
                    color: "from-orange-500 to-red-500",
                  },
                ].map((metric, index) => {
                  const Icon = metric.icon
                  return (
                    <Card
                      key={index}
                      className="border-0 neo-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105"
                      onClick={() => handleComingSoon(`${metric.title} Details`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-2xl font-light mb-1">{metric.value}</div>
                            <div className="text-xs text-gray-600 font-medium">{metric.title}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">{metric.subtitle}</div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Teacher Performance Matrix */}
              <Card className="border-0 neo-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Teacher Performance & Development
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium mb-4">Performance Metrics</h4>
                      <div className="space-y-4">
                        {[
                          { metric: "Student Satisfaction", value: 89.2, target: 85 },
                          { metric: "Curriculum Delivery", value: 92.1, target: 90 },
                          { metric: "Professional Growth", value: 76.4, target: 80 },
                          { metric: "Collaboration", value: 84.7, target: 85 },
                          { metric: "Innovation", value: 78.9, target: 75 },
                        ].map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{item.metric}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{item.value}%</span>
                                <span className="text-xs text-gray-500">Target: {item.target}%</span>
                              </div>
                            </div>
                            <div className="relative">
                              <Progress value={item.value} className="h-2" />
                              <div
                                className="absolute top-0 w-0.5 h-2 bg-red-500"
                                style={{ left: `${item.target}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">Professional Development</h4>
                      <div className="space-y-4">
                        {[
                          { program: "Technology Integration", enrolled: 34, completed: 28 },
                          { program: "Differentiated Learning", enrolled: 45, completed: 41 },
                          { program: "Assessment Strategies", enrolled: 23, completed: 19 },
                          { program: "Classroom Management", enrolled: 18, completed: 16 },
                          { program: "Special Needs Support", enrolled: 29, completed: 24 },
                        ].map((program, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{program.program}</span>
                              <Badge variant="outline">
                                {program.completed}/{program.enrolled}
                              </Badge>
                            </div>
                            <Progress value={(program.completed / program.enrolled) * 100} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Parents Tab */}
            <TabsContent value="parents" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Communication Frequency",
                    value: `${parentEngagement.communicationFrequency}%`,
                    subtitle: "Weekly parent updates",
                    icon: MessageSquare,
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    title: "Event Attendance",
                    value: `${parentEngagement.eventAttendance}%`,
                    subtitle: "School events participation",
                    icon: Calendar,
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    title: "Satisfaction Score",
                    value: `${parentEngagement.satisfactionScore}%`,
                    subtitle: `${parentEngagement.complaintResolution}% complaint resolution`,
                    icon: Star,
                    color: "from-purple-500 to-pink-500",
                  },
                ].map((metric, index) => {
                  const Icon = metric.icon
                  return (
                    <Card
                      key={index}
                      className="border-0 neo-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105"
                      onClick={() => handleComingSoon(`${metric.title} Details`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-2xl font-light mb-1">{metric.value}</div>
                            <div className="text-xs text-gray-600 font-medium">{metric.title}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">{metric.subtitle}</div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Parent Communication Dashboard */}
              <Card className="border-0 neo-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Parent Communication Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium mb-4">Communication Channels</h4>
                      <div className="space-y-4">
                        {[
                          { channel: "Mobile App", usage: 78.5, satisfaction: 92.1 },
                          { channel: "Email", usage: 89.2, satisfaction: 87.3 },
                          { channel: "SMS", usage: 65.4, satisfaction: 94.7 },
                          { channel: "Phone Calls", usage: 34.2, satisfaction: 96.2 },
                          { channel: "In-Person", usage: 23.8, satisfaction: 98.1 },
                        ].map((channel, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{channel.channel}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-600">Usage: {channel.usage}%</span>
                                <span className="text-xs text-gray-600">Satisfaction: {channel.satisfaction}%</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Usage</div>
                                <Progress value={channel.usage} className="h-2" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Satisfaction</div>
                                <Progress value={channel.satisfaction} className="h-2" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">Engagement Trends</h4>
                      <div className="space-y-4">
                        {[
                          { activity: "Parent-Teacher Conferences", participation: 87.3, trend: "up" },
                          { activity: "School Board Meetings", participation: 23.4, trend: "down" },
                          { activity: "Volunteer Activities", participation: 42.8, trend: "up" },
                          { activity: "Fundraising Events", participation: 56.7, trend: "stable" },
                          { activity: "Academic Workshops", participation: 34.2, trend: "up" },
                        ].map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="text-sm font-medium">{activity.activity}</span>
                              <div className="text-xs text-gray-600">{activity.participation}% participation</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {activity.trend === "up" ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : activity.trend === "down" ? (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              ) : (
                                <div className="w-4 h-4 bg-gray-400 rounded-full" />
                              )}
                              <Progress value={activity.participation} className="w-16 h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Finance Tab */}
            <TabsContent value="finance" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: "Total Revenue",
                    value: `$${(financialMetrics.tuitionRevenue + financialMetrics.additionalFees + financialMetrics.governmentFunding) / 1000000}M`,
                    subtitle: "+12.3% YoY growth",
                    icon: DollarSign,
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    title: "Net Profit",
                    value: `$${financialMetrics.netProfit / 1000}K`,
                    subtitle: `${executiveMetrics.profitMargin}% margin`,
                    icon: TrendingUp,
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    title: "Cost per Student",
                    value: `$${executiveMetrics.costPerStudent}`,
                    subtitle: "Operational efficiency",
                    icon: Calculator,
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    title: "Cash Flow",
                    value: `$${financialMetrics.cashFlow / 1000}K`,
                    subtitle: "Monthly recurring",
                    icon: Activity,
                    color: "from-orange-500 to-red-500",
                  },
                ].map((metric, index) => {
                  const Icon = metric.icon
                  return (
                    <Card
                      key={index}
                      className="border-0 neo-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105"
                      onClick={() => handleComingSoon(`${metric.title} Analysis`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-2xl font-light mb-1">{metric.value}</div>
                            <div className="text-xs text-gray-600 font-medium">{metric.title}</div>
                          </div>
                        </div>
                        <div className="text-xs text-green-600">{metric.subtitle}</div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Detailed Financial Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-0 neo-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Pie className="h-5 w-5 text-green-600" />
                      Revenue Streams Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        {
                          stream: "Tuition Fees",
                          current: financialMetrics.tuitionRevenue,
                          projected: financialMetrics.tuitionRevenue * 1.08,
                          growth: 8.2,
                        },
                        {
                          stream: "Additional Fees",
                          current: financialMetrics.additionalFees,
                          projected: financialMetrics.additionalFees * 1.12,
                          growth: 12.1,
                        },
                        {
                          stream: "Government Funding",
                          current: financialMetrics.governmentFunding,
                          projected: financialMetrics.governmentFunding * 1.03,
                          growth: 3.4,
                        },
                      ].map((stream, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-medium">{stream.stream}</span>
                            <Badge className="bg-green-100 text-green-800">+{stream.growth}%</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Current</div>
                              <div className="text-lg font-medium">${(stream.current / 1000).toFixed(0)}K</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Projected</div>
                              <div className="text-lg font-medium text-green-600">
                                ${(stream.projected / 1000).toFixed(0)}K
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 neo-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-red-600" />
                      Expense Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          category: "Teacher Salaries",
                          amount: financialMetrics.teacherSalaries,
                          budget: 1400000,
                          variance: -6.6,
                        },
                        {
                          category: "Infrastructure",
                          amount: financialMetrics.infrastructure,
                          budget: 450000,
                          variance: -3.1,
                        },
                        {
                          category: "Technology",
                          amount: financialMetrics.technology,
                          budget: 200000,
                          variance: 9.0,
                        },
                        {
                          category: "Marketing",
                          amount: financialMetrics.marketing,
                          budget: 120000,
                          variance: -9.2,
                        },
                        {
                          category: "Administration",
                          amount: financialMetrics.administration,
                          budget: 100000,
                          variance: 9.0,
                        },
                      ].map((expense, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{expense.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">${(expense.amount / 1000).toFixed(0)}K</span>
                              <Badge
                                className={
                                  expense.variance > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                                }
                              >
                                {expense.variance > 0 ? "+" : ""}
                                {expense.variance}%
                              </Badge>
                            </div>
                          </div>
                          <div className="relative">
                            <Progress value={(expense.amount / expense.budget) * 100} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Spent: ${(expense.amount / 1000).toFixed(0)}K</span>
                              <span>Budget: ${(expense.budget / 1000).toFixed(0)}K</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: "System Uptime",
                    value: `${technologyMetrics.systemUptime}%`,
                    subtitle: `${technologyMetrics.avgLoadTime}s avg load time`,
                    icon: Server,
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    title: "Class Utilization",
                    value: `${operationalMetrics.classUtilization}%`,
                    subtitle: "Room efficiency",
                    icon: Building,
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    title: "Support Tickets",
                    value: technologyMetrics.supportTickets.toString(),
                    subtitle: `${operationalMetrics.avgResolutionTime}h avg resolution`,
                    icon: Headphones,
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    title: "Resource Efficiency",
                    value: `${operationalMetrics.resourceEfficiency}%`,
                    subtitle: "Operational optimization",
                    icon: Gauge,
                    color: "from-orange-500 to-red-500",
                  },
                ].map((metric, index) => {
                  const Icon = metric.icon
                  return (
                    <Card
                      key={index}
                      className="border-0 neo-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105"
                      onClick={() => handleComingSoon(`${metric.title} Dashboard`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-2xl font-light mb-1">{metric.value}</div>
                            <div className="text-xs text-gray-600 font-medium">{metric.title}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">{metric.subtitle}</div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Technology & Infrastructure Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-0 neo-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-600" />
                      Technology Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { metric: "System Uptime", value: technologyMetrics.systemUptime, target: 99.5 },
                        { metric: "User Satisfaction", value: technologyMetrics.userSatisfaction, target: 85 },
                        { metric: "Mobile Usage", value: technologyMetrics.mobileUsage, target: 70 },
                        { metric: "Feature Adoption", value: technologyMetrics.featureAdoption, target: 80 },
                        { metric: "Cloud Storage", value: technologyMetrics.cloudStorage, target: 75 },
                        { metric: "Bandwidth Utilization", value: technologyMetrics.bandwidth, target: 90 },
                      ].map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{item.metric}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.value}%</span>
                              <Badge
                                className={
                                  item.value >= item.target
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {item.value >= item.target ? "On Target" : "Below Target"}
                              </Badge>
                            </div>
                          </div>
                          <div className="relative">
                            <Progress value={item.value} className="h-2" />
                            <div className="absolute top-0 w-0.5 h-2 bg-red-500" style={{ left: `${item.target}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 neo-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Security & Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          area: "Data Security",
                          status: "Compliant",
                          lastAudit: "2024-01-15",
                          nextReview: "2024-04-15",
                          score: 98,
                        },
                        {
                          area: "Privacy Protection",
                          status: "Compliant",
                          lastAudit: "2024-01-10",
                          nextReview: "2024-04-10",
                          score: 96,
                        },
                        {
                          area: "Access Control",
                          status: "Compliant",
                          lastAudit: "2024-01-20",
                          nextReview: "2024-04-20",
                          score: 94,
                        },
                        {
                          area: "Backup Systems",
                          status: "Compliant",
                          lastAudit: "2024-01-25",
                          nextReview: "2024-04-25",
                          score: 100,
                        },
                      ].map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{item.area}</span>
                            <Badge className="bg-green-100 text-green-800">{item.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                            <div>
                              <span>Last Audit: {item.lastAudit}</span>
                            </div>
                            <div>
                              <span>Next Review: {item.nextReview}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">Compliance Score</span>
                              <span className="text-xs font-medium">{item.score}%</span>
                            </div>
                            <Progress value={item.score} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-8">
              <Card className="border-0 neo-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI-Powered Business Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-purple-600" />
                          Smart Recommendations
                        </h3>
                        <div className="space-y-4">
                          {[
                            {
                              title: "Optimize Class Schedules",
                              description: "AI suggests rearranging 3 classes to improve room utilization by 12%",
                              impact: "High",
                              effort: "Medium",
                            },
                            {
                              title: "Teacher Workload Balancing",
                              description: "Redistribute assignments to reduce burnout risk for 5 teachers",
                              impact: "High",
                              effort: "Low",
                            },
                            {
                              title: "Student Intervention Program",
                              description: "Early identification system flagged 8 students needing support",
                              impact: "Critical",
                              effort: "Medium",
                            },
                          ].map((rec, index) => (
                            <div key={index} className="p-4 bg-white rounded-lg border">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{rec.title}</h4>
                                <Badge
                                  className={
                                    rec.impact === "Critical"
                                      ? "bg-red-100 text-red-800"
                                      : rec.impact === "High"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {rec.impact}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Effort: {rec.effort}</span>
                                <Button size="sm" variant="outline" onClick={() => handleComingSoon(rec.title)}>
                                  Implement
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                          <Target className="h-5 w-5 text-green-600" />
                          Performance Predictions
                        </h3>
                        <div className="space-y-4">
                          {[
                            {
                              metric: "Student Retention",
                              current: 94.2,
                              predicted: 96.1,
                              confidence: 87,
                              timeframe: "Next semester",
                            },
                            {
                              metric: "Teacher Satisfaction",
                              current: 87.5,
                              predicted: 89.8,
                              confidence: 82,
                              timeframe: "End of year",
                            },
                            {
                              metric: "Revenue Growth",
                              current: 12.3,
                              predicted: 15.7,
                              confidence: 79,
                              timeframe: "Next fiscal year",
                            },
                          ].map((pred, index) => (
                            <div key={index} className="p-4 bg-white rounded-lg border">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{pred.metric}</span>
                                <div className="text-right">
                                  <div className="text-sm">
                                    {pred.current}% → <span className="text-green-600">{pred.predicted}%</span>
                                  </div>
                                  <div className="text-xs text-gray-500">{pred.confidence}% confidence</div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">{pred.timeframe}</div>
                              <Progress value={pred.confidence} className="h-2 mt-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          Real-time Insights
                        </h3>
                        <div className="space-y-4">
                          {[
                            {
                              insight: "Peak Learning Hours",
                              value: "10 AM - 12 PM",
                              description: "Students show 23% higher engagement during these hours",
                            },
                            {
                              insight: "Optimal Class Size",
                              value: "18-22 students",
                              description: "Best balance of interaction and individual attention",
                            },
                            {
                              insight: "Teacher Collaboration",
                              value: "Cross-department projects",
                              description: "15% improvement in student outcomes when teachers collaborate",
                            },
                            {
                              insight: "Parent Engagement",
                              value: "Weekly updates",
                              description: "Regular communication correlates with 8% better grades",
                            },
                          ].map((insight, index) => (
                            <div key={index} className="p-4 bg-white rounded-lg border">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium">{insight.insight}</span>
                                <Badge variant="outline">{insight.value}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{insight.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                        <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          Alert System
                        </h3>
                        <div className="space-y-4">
                          {[
                            {
                              type: "Academic",
                              alert: "Math scores declining in Grade 10",
                              severity: "Medium",
                              action: "Review curriculum and teaching methods",
                            },
                            {
                              type: "Financial",
                              alert: "Utility costs 15% above budget",
                              severity: "Low",
                              action: "Implement energy-saving measures",
                            },
                            {
                              type: "Operational",
                              alert: "Library usage down 20%",
                              severity: "Low",
                              action: "Promote library programs and resources",
                            },
                          ].map((alert, index) => (
                            <div key={index} className="p-4 bg-white rounded-lg border">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <Badge variant="outline" className="mb-2">
                                    {alert.type}
                                  </Badge>
                                  <div className="font-medium">{alert.alert}</div>
                                </div>
                                <Badge
                                  className={
                                    alert.severity === "High"
                                      ? "bg-red-100 text-red-800"
                                      : alert.severity === "Medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }
                                >
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{alert.action}</p>
                              <Button size="sm" variant="outline" onClick={() => handleComingSoon("Alert Action")}>
                                Take Action
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  )
}
