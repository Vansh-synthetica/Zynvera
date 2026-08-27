"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Target, Lightbulb, Heart } from "lucide-react"

export default function AboutPage() {
  const handleComingSoon = (feature: string) => {
    alert(`${feature} - Coming Soon! 🚀\n\nWe're excited to share more about our journey. Stay tuned!`)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl font-light tracking-tight mb-8">About Zynvera</h1>
            <p className="text-xl text-gray-500 mb-12 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to democratize education and create a world where every student has access to quality
              learning, regardless of their location or circumstances.
            </p>
          </div>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="py-16 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <Card
              className="border-0 neo-sm bg-white/50 backdrop-blur-sm cursor-pointer hover:neo transition-all duration-500 group hover:scale-105 animate-slide-in-left relative overflow-hidden"
              onClick={() => handleComingSoon("Mission Details")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <CardContent className="p-12 relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-light tracking-tight">Our Mission</h2>
                </div>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  To break down educational barriers and create a global learning ecosystem where students can access
                  world-class education from anywhere. We believe that geography, economic status, or physical
                  limitations should never limit a student's potential to learn and grow.
                </p>
                <div className="space-y-4">
                  {[
                    "Democratize access to quality education",
                    "Empower students through AI-driven personalization",
                    "Create economic opportunities for educators",
                  ].map((point, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 animate-fade-in-up hover:translate-x-2 transition-transform duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-0 neo-sm bg-white/50 backdrop-blur-sm cursor-pointer hover:neo transition-all duration-500 group hover:scale-105 animate-slide-in-right relative overflow-hidden"
              onClick={() => handleComingSoon("Vision Details")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <CardContent className="p-12 relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-light tracking-tight">Our Vision</h2>
                </div>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  A world where education knows no borders—where a student in rural Kenya can attend MIT classes, where
                  a brilliant teacher in India can impact students globally, and where AI ensures every learner receives
                  personalized education that adapts to their unique needs and pace.
                </p>
                <div className="space-y-4">
                  {[
                    "Global classroom connectivity",
                    "AI-powered personalized learning for all",
                    "Sustainable education economy",
                  ].map((point, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 animate-fade-in-up hover:translate-x-2 transition-transform duration-300"
                      style={{ animationDelay: `${index * 100 + 200}ms` }}
                    >
                      <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl font-light tracking-tight mb-6">Meet the Founder</h2>
            <p className="text-gray-500 leading-relaxed">The visionary building the future of education</p>
          </div>

          <div className="flex justify-center">
            <Card
              className="border-0 neo-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105 animate-fade-in-up relative overflow-hidden max-w-md"
              onClick={() => handleComingSoon("Shandie Ventura Profile")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <CardContent className="p-12 text-center relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-8 flex items-center justify-center text-xl font-medium text-white group-hover:scale-110 transition-transform duration-300">
                  VB
                </div>
                <h3 className="text-2xl font-medium mb-3">Shandie Ventura</h3>
                <p className="text-blue-600 mb-6 text-sm font-medium">Founder</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Visionary entrepreneur with a passion for democratizing education through technology. Building the
                  future where every student can access world-class education regardless of their location or
                  circumstances.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl font-light tracking-tight mb-6">Our Core Values</h2>
            <p className="text-gray-500 leading-relaxed">The principles that guide everything we do</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Innovation",
                description:
                  "We constantly push the boundaries of what's possible in education, leveraging cutting-edge AI and technology to create breakthrough learning experiences.",
                icon: Lightbulb,
                color: "from-yellow-500 to-orange-500",
              },
              {
                title: "Access",
                description:
                  "Education should be a right, not a privilege. We're committed to breaking down every barrier that prevents students from accessing quality learning opportunities.",
                icon: Target,
                color: "from-blue-500 to-purple-500",
              },
              {
                title: "Empowerment",
                description:
                  "We believe in empowering both learners and educators to reach their full potential through personalized, adaptive, and meaningful educational experiences.",
                icon: Heart,
                color: "from-pink-500 to-red-500",
              },
            ].map((value, index) => {
              const Icon = value.icon
              return (
                <Card
                  key={index}
                  className="border-0 neo-sm text-center bg-white/50 backdrop-blur-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105 animate-fade-in-up relative overflow-hidden"
                  style={{ animationDelay: `${index * 200}ms` }}
                  onClick={() => handleComingSoon(`${value.title} Details`)}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />
                  <CardContent className="p-12 relative z-10">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-medium mb-6 tracking-tight">{value.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-light tracking-tight mb-6">Join Our Mission</h2>
            <p className="text-xl text-gray-500 mb-12 leading-relaxed">
              Help us build the future of education and make learning accessible to everyone, everywhere.
            </p>
            <Button
              size="lg"
              className="bg-black text-white hover:bg-gray-800 rounded-full px-12 py-4 group hover:scale-110 transition-all duration-500 neo hover:shadow-2xl relative overflow-hidden"
              onClick={() => handleComingSoon("Join Mission")}
            >
              <span className="relative z-10 flex items-center">
                Join Our Mission
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
