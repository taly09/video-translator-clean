import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils/createPageUrl";
import {
  Check, Crown, Zap, Users, MessageSquare,
  Brain, Languages, FileText, Headphones,
  Star, ArrowRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Pricing() {
  const [userCurrency, setUserCurrency] = useState({ symbol: "₪", rate: 1 });

useEffect(() => {
  const getUserLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      const country = "US";

      const currencyMap = {
        IL: { symbol: "₪", rate: 1 },          // ישראל
  US: { symbol: "$", rate: 0.27 },       // ארה"ב
  EU: { symbol: "€", rate: 0.25 },       // אירופה
  GB: { symbol: "£", rate: 0.22 },       // בריטניה
  IN: { symbol: "₹", rate: 23 },         // הודו
  EG: { symbol: "E£", rate: 8.5 },       // מצרים
  SA: { symbol: "﷼", rate: 1.01 },       // סעודיה (ריאל)
  AE: { symbol: "د.إ", rate: 0.98 },     // איחוד האמירויות (דירהם)
  CA: { symbol: "C$", rate: 0.37 },      // קנדה
  AU: { symbol: "A$", rate: 0.39 },      // אוסטרליה
  ZA: { symbol: "R", rate: 5 },          // דרום אפריקה
  NG: { symbol: "₦", rate: 220 },        // ניגריה
  PH: { symbol: "₱", rate: 15 },         // הפיליפינים
  CN: { symbol: "¥", rate: 1.93 },       // סין
  JP: { symbol: "¥", rate: 41 },         // יפן
  BR: { symbol: "R$", rate: 1.5 },       // ברזיל
      };

      setUserCurrency(currencyMap[country] || { symbol: "₪", rate: 1 });
    } catch (e) {
      console.warn("Location fetch failed, using default currency");
    }
  };

  getUserLocation();
}, []);

  const [isYearly, setIsYearly] = useState(false);

  const plans = [
  {
    name: "חינם",
    description: "תמלול בסיסי להתנסות ראשונית",
    price: { monthly: 0, yearly: 0 },
    features: [
      "3 תמלולים בחודש",
      "עד 30 דקות לתמלול",
      "תמיכה בעברית ואנגלית",
      "ייצוא לקובצי TXT ו-SRT",
      "איכות תמלול HD"
    ],
    limitations: [
      "ללא AI Summary",
      "ללא תמלול חי",
      "ללא תמיכה מועדפת"
    ],
    popular: false,
    cta: "התחל ללא עלות",
    color: "gray"
  },
  {
    name: "Pro",
    description: "ליצרני תוכן, מרצים ועסקים קטנים",
    price: { monthly: 25, yearly: 21 }, // ₪25 ≈ $6.90
    features: [
      "100 תמלולים בחודש",
      "עד שעתיים לתמלול",
      "תמיכה ב-15 שפות",
      "AI Summary חכם",
      "תמלול WhatsApp",
      "ייצוא לכל הפורמטים (PDF, DOCX, MP4)",
      "עדיפות בעיבוד",
      "תמיכה בדוא״ל"
    ],
    limitations: [],
    popular: true,
    cta: "התחל ניסיון בחינם",
    color: "blue"
  },
  {
    name: "Premium",
    description: "לצוותים, חברות ויוצרים מתקדמים",
    price: { monthly: 55, yearly: 45 }, // ₪55 ≈ $14.90
    features: [
      "תמלולים ללא הגבלה",
      "ללא הגבלת משך לקובץ",
      "תמיכה בכל השפות והניבים",
      "AI Summary מתקדם",
      "תמלול חי ברמה פרימיום",
      "גישה ל־API",
      "ניהול צוותים והרשאות",
      "אחסון בענן מוגדל",
      "תמיכה טלפונית 24/7",
      "SLA מקצועי (99.9%)"
    ],
    limitations: [],
    popular: false,
    cta: "צור קשר עם צוות המכירות",
    color: "purple"
  },
  {
    name: "10 קרדיטים",
    description: "לשימוש חד-פעמי ללא מנוי",
    price: { monthly: 4.9, yearly: 4.9 },
    features: [
      "10 תמלולים חד־פעמיים",
      "שימוש מיידי לפי צורך",
      "אין צורך בהרשמה למנוי"
    ],
    limitations: [],
    popular: false,
    cta: "רכוש כעת",
    color: "green"
  }
];


  const features = [
    {
      category: "תמלול בסיסי",
      items: [
        { name: "מספר תמלולים בחודש", free: "3", pro: "50", premium: "ללא הגבלה" },
        { name: "אורך מקסימלי לתמלול", free: "30 דקות", pro: "4 שעות", premium: "ללא הגבלה" },
        { name: "איכות תמלול", free: "HD", pro: "HD+", premium: "Ultra HD" },
        { name: "זמן עיבוד", free: "רגיל", pro: "מהיר", premium: "מהיר ביותר" }
      ]
    },
    {
      category: "שפות ותרגום",
      items: [
        { name: "שפות נתמכות", free: "עברית, אנגלית", pro: "15 שפות", premium: "20+ שפות וניבים" },
        { name: "תרגום אוטומטי", free: "✗", pro: "✓", premium: "✓ מתקדם" },
        { name: "זיהוי שפה אוטומטי", free: "✓", pro: "✓", premium: "✓ מדויק יותר" }
      ]
    },
    {
      category: "תכונות חכמות",
      items: [
        { name: "AI Summary", free: "✗", pro: "✓", premium: "✓ מתקדם" },
        { name: "זיהוי דוברים", free: "✗", pro: "✓", premium: "✓ מתקדם" },
        { name: "ניתוח סנטימנט", free: "✗", pro: "בסיסי", premium: "מתקדם" },
        { name: "תגיות אוטומטיות", free: "✗", pro: "✓", premium: "✓ חכמות" }
      ]
    },
    {
      category: "מקורות תמלול",
      items: [
        { name: "קבצי וידאו ואודיו", free: "✓", pro: "✓", premium: "✓" },
        { name: "תמלול WhatsApp", free: "✗", pro: "✓", premium: "✓" },
        { name: "תמלול חי", free: "✗", pro: "✓", premium: "✓ פרימיום" },
        { name: "Zoom/Teams integration", free: "✗", pro: "✗", premium: "✓" }
      ]
    }
  ];

  const testimonials = [
    {
      name: "דר' אבי כהן",
      role: "חוקר באוניברסיטה",
      plan: "Premium",
      content: "החיסכון בזמן מדהים. מה שלקח לי שעות עכשיו נגמר בדקות.",
      rating: 5
    },
    {
      name: "רחל לוי",
      role: "יוצרת תוכן",
      plan: "Pro",
      content: "הפתרון המושלם לתמלול הפודקאסטים שלי. איכות מעולה!",
      rating: 5
    },
    {
      name: "יוסי ברק",
      role: "עיתונאי",
      plan: "Pro",
      content: "תמלול הריאיונות מעולם לא היה כל כך קל ומדויק.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "האם יש תקופת ניסיון חינם?",
      answer: "כן! תוכנית Pro כוללת 7 ימי ניסיון חינם ללא התחייבות. ניתן לבטל בכל עת."
    },
    {
      question: "מה קורה אם אחרוג ממגבלת התמלולים?",
      answer: "במידה ותחרוג, תוכל לשדרג את התוכנית או לחכות לחידוש החודשי. אנחנו נשלח התראה מראש."
    },
    {
      question: "האם הנתונים שלי מאובטחים?",
      answer: "בהחלט. אנו משתמשים בהצפנה מתקדמת ולא שומרים את הקבצים שלך יותר מ-30 יום."
    },
    {
      question: "איך עובד התמלול בשפות שונות?",
      answer: "המערכת מזהה אוטומטית את השפה או שאתה יכול לבחור ידנית. תמיכה ב-15+ שפות עם דיוק גבוה."
    },
    {
      question: "האם ניתן לבטל את המנוי?",
      answer: "כן, ניתן לבטל בכל עת דרך הגדרות החשבון. המנוי יהיה פעיל עד סוף התקופה ששולמה."
    }
  ];

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <style jsx>{`
        .gradient-text {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gradient-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
          backdrop-filter: blur(16px);
        }
      `}</style>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                מחירים שקופים וללא הפתעות
              </Badge>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">תמחור</span>
              <br />
              <span className="text-slate-800">שמתאים לכולם</span>
            </h1>

            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              מתוכנן בחינם ושדרג בהתאם לצרכים שלך. ללא עלויות נסתרות, ללא התחייבות ארוכת טווח.
            </p>

            {/* Yearly/Monthly Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                חיוב חודשי
              </span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} />
              <span className={`text-sm font-medium ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                חיוב שנתי
              </span>
              {isYearly && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  חסוך 20%
                </Badge>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1 rounded-full shadow-lg">
                      הכי פופולרי
                    </Badge>
                  </div>
                )}

                <Card className={`h-full ${plan.popular ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'shadow-lg'} gradient-card border-white/20`}>
                  <CardHeader className="text-center pb-6">
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                      plan.color === 'blue' ? 'bg-blue-100' :
                      plan.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {plan.color === 'blue' ? <Crown className="w-8 h-8 text-blue-600" /> :
                       plan.color === 'purple' ? <Users className="w-8 h-8 text-purple-600" /> :
                       <FileText className="w-8 h-8 text-gray-600" />}
                    </div>

                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <p className="text-slate-600">{plan.description}</p>

                    <div className="mt-4">
                      <div className="text-4xl font-bold">
  {userCurrency.symbol}
  {Math.round((isYearly ? plan.price.yearly : plan.price.monthly) * userCurrency.rate)}
  <span className="text-lg font-normal text-slate-600">
    {plan.price.monthly > 0 ? '/חודש' : ''}
  </span>
</div>

                      {isYearly && plan.price.monthly > 0 && (
                        <p className="text-sm text-slate-500 mt-1">
                          חיוב שנתי ₪{plan.price.yearly * 12}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}

                      {plan.limitations.map((limitation, i) => (
                        <div key={i} className="flex items-center gap-3 opacity-60">
                          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          </div>
                          <span className="text-sm line-through">{limitation}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-900 border-2'
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Comparison */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">השוואה מפורטת</h2>
            <p className="text-xl text-slate-600">הבן בדיוק מה כלול בכל תוכנית</p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8">
              {features.map((category, index) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="gradient-card border-white/20">
                    <CardHeader>
                      <CardTitle className="text-lg">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right py-3 font-medium">תכונה</th>
                              <th className="text-center py-3 font-medium">חינם</th>
                              <th className="text-center py-3 font-medium">Pro</th>
                              <th className="text-center py-3 font-medium">Premium</th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.items.map((item, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="py-3 text-sm">{item.name}</td>
                                <td className="py-3 text-center text-sm">{item.free}</td>
                                <td className="py-3 text-center text-sm">{item.pro}</td>
                                <td className="py-3 text-center text-sm">{item.premium}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">מה הלקוחות אומרים</h2>
            <p className="text-xl text-slate-600">למעלה מ-10,000 לקוחות מרוצים</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="gradient-card border-white/20 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 italic">"{testimonial.content}"</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{testimonial.name}</div>
                        <div className="text-sm text-slate-500">{testimonial.role}</div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {testimonial.plan}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">שאלות נפוצות</h2>
            <p className="text-xl text-slate-600">תשובות לשאלות הנפוצות ביותר</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="gradient-card border-white/20">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-slate-800 mb-2">{faq.question}</h3>
                    <p className="text-slate-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">מוכן להתחיל?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              התחל עם התוכנית החינמית או נסה את Pro ללא סיכון
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
  <Link to={createPageUrl("Upload")}>
    התחל בחינם
    <ArrowRight className="w-5 h-5 mr-2" />
  </Link>
</Button>

              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                צור קשר למכירות
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}