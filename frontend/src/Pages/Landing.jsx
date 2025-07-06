import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/createPageUrl";
import {
  FileText, Mic, Zap, ChevronRight,
  PlayCircle, MessageSquare, Users,
  CheckCircle, Star, ArrowRight, Sparkles,
  Video, Headphones, Languages, Brain,
  UploadCloud, ShieldCheck, Clock, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Helmet } from "react-helmet";

// Internal Layout component just for the Landing Page
function LandingPageLayout({ children }) {
  const { t, i18n } = useTranslation();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-800 dark:text-slate-200"
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.documentElement.style.setProperty("--x", `${x}%`);
        document.documentElement.style.setProperty("--y", `${y}%`);
      }}
      dir={i18n.language === "he" ? "rtl" : "ltr"}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        body {
          font-family: 'Inter', sans-serif;
        }

        .gradient-background {
          background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(59, 130, 246, 0.1), transparent 40%);
          transition: background 0.3s ease;
        }

        .dark .gradient-background {
          background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(59, 130, 246, 0.15), transparent 40%);
        }
        
        .hero-title-gradient {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .card-glow {
            position: relative;
            transition: all 0.3s ease;
        }
        .card-glow::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            border-radius: 1.5rem; /* Corresponds to rounded-3xl */
            background: radial-gradient(
                400px circle at var(--x) var(--y),
                rgba(59, 130, 246, 0.2),
                transparent 40%
            );
            z-index: 0;
            opacity: 0;
            transition: opacity 0.4s ease;
        }
        .card-glow:hover::before {
            opacity: 1;
        }

        .glass-effect {
          backdrop-filter: blur(12px);
          background-color: rgba(255, 255, 255, 0.7);
        }

        .dark .glass-effect {
          background-color: rgba(30, 41, 59, 0.7);
        }
      `}</style>
      
      <div className="gradient-background overflow-x-hidden">

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="container mx-auto px-3 py-4 flex justify-between items-center glass-effect border-b border-white/20 dark:border-slate-700/50">

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link to={createPageUrl("Dashboard")}>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full px-6">
                  {t("hero.startFree")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main>
            {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            <div className="container mx-auto px-6 py-16">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                <div>
                  <Link to="/" className="flex items-center gap-3 mb-6">
                    <img src="/logo.png" alt="Logo" className="h-10 object-contain" />
                  </Link>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xs">{t("footer.desc")}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-5">{t("footer.features")}</h3>
                  <ul className="space-y-3">
                    {[t("footer.video"), t("footer.whatsapp"), t("footer.live"), t("footer.summary")].map(item => (
                      <li key={item}>
                        <a href="#" className="hover:text-blue-500 transition-colors">{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-5">{t("footer.support")}</h3>
                  <ul className="space-y-3">
                    {[t("footer.help"), t("footer.contact"), t("footer.guides"), t("footer.api")].map(item => (
                      <li key={item}>
                        <a href="#" className="hover:text-blue-500 transition-colors">{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-5">{t("footer.company")}</h3>
                  <ul className="space-y-3">
                    {[t("footer.about"), t("footer.blog"), t("footer.career"), t("footer.privacy")].map(item => (
                      <li key={item}>
                        <a href="#" className="hover:text-blue-500 transition-colors">{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm">
                <p>© {new Date().getFullYear()} {t("footer.brand")}. {t("footer.copyright")}</p>
              </div>
            </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, badge, delay }) {
  return (
    <motion.div
      className="glass-effect border border-white/20 dark:border-slate-700/50 p-8 rounded-3xl text-center card-glow"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
      {badge && (
        <Badge className={`mt-4 ${badge === 'Pro' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'}`}>
          {badge}
        </Badge>
      )}
    </motion.div>
  );
}

function UseCaseCard({ title, description, features, icon: Icon, delay }) {
  return (
    <motion.div
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-8 rounded-3xl card-glow border border-white/30 dark:border-slate-700/50 h-full flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      <p className="text-slate-600 dark:text-slate-300 mb-6 flex-grow">{description}</p>
      <ul className="space-y-3">
        {Array.isArray(features) && features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [activeDemo, setActiveDemo] = useState(0);
  const testimonialKeys = i18n.language === "he" ? ["t1", "t2", "t3"] : ["1", "2", "3"];

  const demos = [
    { key: "demos.youtube", time: "2:34", accuracy: "98%", icon: <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" /> },
    { key: "demos.zoom", time: "45:12", accuracy: "97%", icon: <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" /> },
    { key: "demos.whatsapp", time: "1:23", accuracy: "99%", icon: <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" /> }
  ];

  const stats = [
    { number: "50K+", label: t("stats.completed"), icon: CheckCircle },
    { number: "98%", label: t("stats.accuracy"), icon: Award },
    { number: "15", label: t("stats.languages"), icon: Languages },
    { number: "1H+", label: t("stats.savedTime"), icon: Clock }
  ];

  const features = [
    {
      icon: MessageSquare,
      title: t("features.whatsapp.title"),
      description: t("features.whatsapp.desc"),
      badge: t("features.whatsapp.badge")
    },
    {
      icon: Brain,
      title: t("features.summary.title"),
      description: t("features.summary.desc"),
    },
    {
      icon: Languages,
      title: t("features.multilang.title"),
      description: t("features.multilang.desc"),
    },
    {
      icon: Zap,
      title: t("features.speed.title"),
      description: t("features.speed.desc"),
    },
    {
      icon: Headphones,
      title: t("features.live.title"),
      description: t("features.live.desc"),
      badge: t("features.live.badge")
    },
    {
      icon: FileText,
      title: t("features.export.title"),
      description: t("features.export.desc"),
    }
  ];

  const useCases = [
    {
      title: t("usecases.creators.title"),
      description: t("usecases.creators.desc"),
      features: t("usecases.creators.features", { returnObjects: true }),
      icon: Video
    },
    {
      title: t("usecases.business.title"),
      description: t("usecases.business.desc"),
      features: t("usecases.business.features", { returnObjects: true }),
      icon: Users
    },
    {
      title: t("usecases.academia.title"),
      description: t("usecases.academia.desc"),
      features: t("usecases.academia.features", { returnObjects: true }),
      icon: Brain
    }
  ];

  return (
          <>


    <LandingPageLayout>

        {/* Hero Section */}
        <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: i18n.language === "he" ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-start"
            >
              <Badge variant="outline" className="border-blue-300 text-blue-600 bg-blue-50/80 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300 py-2 px-4 text-sm font-semibold mb-6 inline-flex items-center gap-2 rounded-full backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                {t("hero.badge")}
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
                <span className="hero-title-gradient">{t("hero.title1")}</span>
                <br />
                <span className="text-slate-800 dark:text-slate-100">{t("hero.title2")}</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t("hero.description")}
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-5">
                <Link to={createPageUrl("Upload")}>
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/40 px-10 py-7 rounded-2xl text-lg font-semibold transition-all duration-300 hover:scale-105">
                    {t("hero.startFree")}
                    <ChevronRight className="w-6 h-6 mr-3" />
                  </Button>
                </Link>
                <Link to={createPageUrl("LiveTranscription")}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto glass-effect border-2 border-slate-300 dark:border-slate-600 px-10 py-7 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3 hover:scale-105 transition-transform duration-300">
                    <Mic className="w-6 h-6" />
                    {t("hero.liveTranscription")}
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4 text-slate-500 dark:text-slate-400 font-medium">
                  {[t("hero.feature1"), t("hero.feature2"), t("hero.feature3")].map(feat => (
                      <div key={feat} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          {feat}
                      </div>
                  ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <Card className="glass-effect p-6 rounded-3xl shadow-2xl shadow-blue-500/10 dark:shadow-blue-900/20 card-glow max-w-md mx-auto">
                <CardContent className="p-0">
                  <div className="flex mb-6 border-b border-slate-200 dark:border-slate-700">
                    {demos.map((demo, index) => (
                      <button
                        key={demo.key}
                        onClick={() => setActiveDemo(index)}
                        className={`flex-1 py-4 text-center text-base font-semibold transition-all duration-300 relative ${
                          activeDemo === index ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-blue-500 dark:hover:text-blue-400"
                        }`}
                      >
                        {t(demo.key)}
                        {activeDemo === index && (
                          <motion.div
                            layoutId="demo-underline"
                            className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeDemo}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                            {demos[activeDemo].icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-800 dark:text-blue-200">{t(demos[activeDemo].key)}</h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              {demos[activeDemo].time} &bull; {t("common.accuracy")} {demos[activeDemo].accuracy}
                            </p>
                          </div>
                        </div>
                        <PlayCircle className="w-9 h-9 text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-200 transition-colors" />
                      </div>
                      <div className="aspect-video bg-slate-200/50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center">
                        <UploadCloud className="w-20 h-20 text-slate-400 dark:text-slate-600" />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
              >
                <div className="w-16 h-16 mx-auto flex items-center justify-center text-blue-500 mb-4 bg-blue-100/80 dark:bg-blue-900/30 rounded-2xl">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-4xl lg:text-5xl font-extrabold hero-title-gradient mb-2">{stat.number}</div>
                <div className="text-slate-600 dark:text-slate-400 font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white/50 dark:bg-slate-800/20 backdrop-blur-lg">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 dark:text-white">{t("features.title")}</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">{t("features.subtitle")}</p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  badge={feature.badge}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-24 container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 dark:text-white">{t("usecases.title")}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">{t("usecases.subtitle")}</p>
          </motion.div>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <UseCaseCard
                key={index}
                title={useCase.title}
                description={useCase.description}
                features={useCase.features}
                icon={useCase.icon}
                delay={index * 0.1}
              />
            ))}
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="py-24 bg-white/50 dark:bg-slate-800/20 backdrop-blur-lg">
          <div className="container mx-auto px-6">
             <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 dark:text-white">{t("testimonials.title")}</h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">{t("testimonials.subtitle")}</p>
            </motion.div>
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
              {testimonialKeys.map((id, index) => (
                <motion.div
                  key={id}
                  className="glass-effect border border-white/20 dark:border-slate-700/50 p-8 rounded-3xl card-glow"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-1 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 italic text-lg leading-relaxed">"{t(`testimonials.${id}.content`)}"</p>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{t(`testimonials.${id}.name`)}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{t(`testimonials.${id}.role`)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 container mx-auto px-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 md:p-16 rounded-3xl text-center shadow-2xl shadow-blue-500/30"
            >
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">{t("cta.title")}</h2>
                <p className="text-lg md:text-xl text-blue-200 mb-12 max-w-3xl mx-auto">{t("cta.subtitle")}</p>
                 <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Link to={createPageUrl("Upload")}>
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 font-bold px-10 py-7 rounded-2xl text-lg h-auto w-full sm:w-auto shadow-lg hover:scale-105 transition-transform duration-300">
                      {t("cta.button1")}
                      <ArrowRight className="w-6 h-6 ml-3" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl("WhatsAppUpload")}>
                    <Button size="lg" variant="outline" className="border-2 border-blue-300 text-white hover:bg-white/10 hover:border-white/80 px-10 py-7 rounded-2xl text-lg h-auto w-full sm:w-auto transition-colors duration-300">
                      {t("cta.button2")}
                      <MessageSquare className="w-6 h-6 ml-3" />
                    </Button>
                  </Link>
                </div>
            </motion.div>
        </section>
    </LandingPageLayout>
                </>

  );
}