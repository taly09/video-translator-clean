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

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [activeDemo, setActiveDemo] = useState(0);
  const testimonialKeys = i18n.language === "he" ? ["t1", "t2", "t3"] : ["1", "2", "3"];

  const demos = [
    { key: "demos.youtube", time: "2:34", accuracy: "98%", icon: <Video className="w-6 h-6 text-blue-600" /> },
    { key: "demos.zoom", time: "45:12", accuracy: "97%", icon: <Mic className="w-6 h-6 text-blue-600" /> },
    { key: "demos.whatsapp", time: "1:23", accuracy: "99%", icon: <MessageSquare className="w-6 h-6 text-blue-600" /> }
  ];

  const stats = [
    { number: "50K+", label: t("stats.completed"), icon: <CheckCircle className="w-8 h-8 text-blue-500" /> },
    { number: "98%", label: t("stats.accuracy"), icon: <Award className="w-8 h-8 text-blue-500" /> },
    { number: "15", label: t("stats.languages"), icon: <Languages className="w-8 h-8 text-blue-500" /> },
    { number: "1H+", label: t("stats.savedTime"), icon: <Clock className="w-8 h-8 text-blue-500" /> }
  ];

  const features = [
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      title: t("features.whatsapp.title"),
      description: t("features.whatsapp.desc"),
      badge: t("features.whatsapp.badge")
    },
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: t("features.summary.title"),
      description: t("features.summary.desc"),
    },
    {
      icon: <Languages className="w-8 h-8 text-blue-600" />,
      title: t("features.multilang.title"),
      description: t("features.multilang.desc"),
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: t("features.speed.title"),
      description: t("features.speed.desc"),
    },
    {
      icon: <Headphones className="w-8 h-8 text-blue-600" />,
      title: t("features.live.title"),
      description: t("features.live.desc"),
      badge: t("features.live.badge")
    },
    {
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      title: t("features.export.title"),
      description: t("features.export.desc"),
    }
  ];

  const useCases = [
    {
      title: t("usecases.creators.title"),
      description: t("usecases.creators.desc"),
      features: t("usecases.creators.features", { returnObjects: true }),
      icon: <Video className="w-12 h-12 text-blue-600" />
    },
    {
      title: t("usecases.business.title"),
      description: t("usecases.business.desc"),
      features: t("usecases.business.features", { returnObjects: true }),
      icon: <Users className="w-12 h-12 text-blue-600" />
    },
    {
      title: t("usecases.academia.title"),
      description: t("usecases.academia.desc"),
      features: t("usecases.academia.features", { returnObjects: true }),
      icon: <Brain className="w-12 h-12 text-blue-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 text-slate-800" dir={i18n.language === "he" ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');

        body {
          font-family: 'Rubik', sans-serif;
        }
        .hero-title-gradient {
          background: linear-gradient(45deg, #0c4a6e, #0ea5e9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .section-title {
          color: #0c4a6e;
        }
        .card-shadow {
          box-shadow: 0 10px 20px rgba(14, 165, 233, 0.15);
        }
        .card-hover-effect {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover-effect:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 40px rgba(14, 165, 233, 0.25);
        }
        .btn-primary {
          background-color: #0ea5e9;
          color: white;
          transition: background-color 0.3s ease;
        }
        .btn-primary:hover {
          background-color: #0c4a6e;
        }
        .btn-secondary {
          background-color: transparent;
          color: #0ea5e9;
          border: 2px solid #0ea5e9;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .btn-secondary:hover {
          background-color: #0ea5e9;
          color: white;
        }
      `}</style>

      {/* Hero */}
      <section className="py-24 md:py-32 bg-white shadow-md rounded-xl max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: i18n.language === "he" ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center lg:text-right"
          >
            <Badge variant="outline" className="border-blue-300 text-blue-600 bg-blue-50 py-2 px-4 text-sm font-semibold mb-6 inline-flex items-center gap-2 rounded-full">
              <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
              {t("hero.badge")}
            </Badge>
            <h1 className="text-6xl font-extrabold mb-6 leading-tight">
              <span className="hero-title-gradient">{t("hero.title1")}</span>
              <br />
              <span className="text-slate-700">{t("hero.title2")}</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-lg mx-auto lg:mx-0">
              {t("hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-5">
              <Link to={createPageUrl("Upload")}>
                <Button size="lg" className="btn-primary px-12 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-blue-400/40 hover:shadow-blue-500/60">
                  {t("hero.startFree")}
                  <ChevronRight className="w-6 h-6 ml-3" />
                </Button>
              </Link>
              <Link to={createPageUrl("Live")}>
                <Button size="lg" variant="outline" className="btn-secondary px-12 py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-3">
                  <Mic className="w-6 h-6" />
                  {t("hero.liveTranscription")}
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-x-10 gap-y-4 text-lg text-slate-500 font-medium">
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
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <div className="bg-white p-8 rounded-3xl card-shadow max-w-md mx-auto">
              <div className="flex mb-8 border-b border-slate-200">
                {demos.map((demo, index) => (
                  <button
                    key={demo.key}
                    onClick={() => setActiveDemo(index)}
                    className={`flex-1 py-4 text-center text-base font-semibold transition-colors duration-200 relative
                      ${activeDemo === index ? "text-blue-600 border-b-4 border-blue-600" : "text-slate-500 hover:text-blue-500"}`}
                  >
                    {t(demo.key)}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDemo}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                        {demos[activeDemo].icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-700">{t(demos[activeDemo].key)}</h3>
                        <p className="text-sm text-blue-600">
                          {demos[activeDemo].time} &bull; {t("common.accuracy")} {demos[activeDemo].accuracy}
                        </p>
                      </div>
                    </div>
                    <PlayCircle className="w-9 h-9 text-blue-600 cursor-pointer hover:text-blue-800" />
                  </div>
                  <div className="aspect-video bg-blue-100 rounded-xl flex items-center justify-center">
                    <UploadCloud className="w-20 h-20 text-blue-300" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center p-8 bg-white rounded-2xl card-shadow card-hover-effect"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="mb-4 mx-auto w-14 h-14 flex items-center justify-center text-blue-600">
                {stat.icon}
              </div>
              <div className="text-4xl font-extrabold text-blue-700 mb-2">{stat.number}</div>
              <div className="text-slate-600 font-semibold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-extrabold section-title mb-4">{t("features.title")}</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">{t("features.subtitle")}</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
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
      </section>

      {/* Use Cases Section */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-extrabold section-title mb-4">{t("usecases.title")}</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">{t("usecases.subtitle")}</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-10">
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
      <section className="py-20 bg-white max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-extrabold section-title mb-4">{t("testimonials.title")}</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">{t("testimonials.subtitle")}</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-10">
          {testimonialKeys.map((id, index) => (
            <motion.div
              key={id}
              className="bg-slate-50 p-8 rounded-2xl card-shadow card-hover-effect"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-600 mb-6 italic">"{t(`testimonials.${id}.content`)}"</p>
              <div>
                <div className="font-semibold text-slate-700">{t(`testimonials.${id}.name`)}</div>
                <div className="text-sm text-slate-500">{t(`testimonials.${id}.role`)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-extrabold mb-6">{t("cta.title")}</h2>
            <p className="text-xl text-blue-200 mb-12 max-w-3xl mx-auto">{t("cta.subtitle")}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link to={createPageUrl("Upload")}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-10 py-4 rounded-xl text-lg h-auto w-full sm:w-auto shadow-lg">
                  {t("cta.button1")}
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </Link>
              <Link to={createPageUrl("WhatsAppUpload")}>
                <Button size="lg" variant="outline" className="border-2 border-blue-300 text-white hover:bg-blue-500 hover:border-blue-500 px-10 py-4 rounded-xl text-lg h-auto w-full sm:w-auto">
                  {t("cta.button2")}
                  <MessageSquare className="w-6 h-6 ml-3" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-7 h-7 text-blue-400" />
                <span className="text-2xl font-extrabold text-white">{t("footer.brand")}</span>
              </div>
              <p className="text-slate-400 max-w-xs">{t("footer.desc")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-5">{t("footer.features")}</h3>
              <ul className="space-y-3 text-slate-400">
                {[t("footer.video"), t("footer.whatsapp"), t("footer.live"), t("footer.summary")].map(item => (
                  <li key={item}>
                    <a href="#" className="hover:text-blue-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-5">{t("footer.support")}</h3>
              <ul className="space-y-3 text-slate-400">
                {[t("footer.help"), t("footer.contact"), t("footer.guides"), t("footer.api")].map(item => (
                  <li key={item}>
                    <a href="#" className="hover:text-blue-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-5">{t("footer.company")}</h3>
              <ul className="space-y-3 text-slate-400">
                {[t("footer.about"), t("footer.blog"), t("footer.career"), t("footer.privacy")].map(item => (
                  <li key={item}>
                    <a href="#" className="hover:text-blue-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>© {new Date().getFullYear()} {t("footer.brand")}. {t("footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, badge, delay }) {
  return (
    <motion.div
      className="bg-white p-8 rounded-2xl card-shadow card-hover-effect text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
      {badge && (
        <Badge className="mt-4 bg-emerald-100 text-emerald-700 border-emerald-200">
          {badge}
        </Badge>
      )}
    </motion.div>
  );
}

function UseCaseCard({ title, description, features, icon, delay }) {
  return (
    <motion.div
      className="bg-white p-8 rounded-2xl card-shadow card-hover-effect"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-slate-700">{title}</h3>
      </div>
      <p className="text-slate-500 mb-6">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
