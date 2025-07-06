import React, { useState, useEffect } from "react";
import {
  Languages, Check, Loader2,
  Trash2, Settings as SettingsIcon,
  RotateCcw, Clock, FileText
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Skeleton } from "../components/ui/skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Setting } from "../entities/Setting";

const LANGUAGES = [
  { code: "auto", name: "זיהוי אוטומטי" },
  { code: "he", name: "עברית" },
  { code: "en", name: "אנגלית" },
  { code: "ar", name: "ערבית" },
  { code: "ru", name: "רוסית" },
  { code: "fr", name: "צרפתית" },
  { code: "es", name: "ספרדית" },
  { code: "de", name: "גרמנית" },
  { code: "it", name: "איטלקית" },
  { code: "zh", name: "סינית" },
  { code: "ja", name: "יפנית" },
];

const WHISPER_MODELS = [
  { value: "base", name: "בסיסי", description: "מהיר, דיוק נמוך" },
  { value: "small", name: "קטן", description: "מהירות בינונית, דיוק בינוני" },
  { value: "medium", name: "בינוני", description: "איטי יותר, דיוק גבוה" },
  { value: "large-v2", name: "גדול v2", description: "איטי, דיוק מעולה" },
  { value: "large-v3", name: "גדול v3", description: "הדגם החדש והמדויק ביותר" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    id: null,
    whisper_model: "large-v3",
    default_language: "auto",
    default_translation_language: "he",
    auto_translate: false,
    theme: "light"
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await Setting.list();

      if (data.length > 0) {
        setSettings(data[0]);
      }
    } catch (error) {
      console.error("Error loading settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);

      if (settings.id) {
        await Setting.update(settings.id, settings);
      } else {
        const newSettings = await Setting.create(settings);
        setSettings(newSettings);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      id: settings.id,
      whisper_model: "large-v3",
      default_language: "auto",
      default_translation_language: "he",
      auto_translate: false,
      theme: "light"
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">הגדרות</h1>
            <p className="text-muted-foreground">התאם את הגדרות המערכת</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">הגדרות</h1>
          <p className="text-muted-foreground">התאם את הגדרות המערכת</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={resetSettings}>
            <RotateCcw className="ml-2 h-4 w-4" />
            איפוס
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שומר...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="ml-2 h-4 w-4" />
                נשמר!
              </>
            ) : (
              <>
                <Check className="ml-2 h-4 w-4" />
                שמור הגדרות
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-4 md:w-max">
          <TabsTrigger value="general">
            <SettingsIcon className="ml-2 h-4 w-4" />
            כללי
          </TabsTrigger>
          <TabsTrigger value="transcription">
            <FileText className="ml-2 h-4 w-4" />
            תמלול
          </TabsTrigger>
          <TabsTrigger value="translation">
            <Languages className="ml-2 h-4 w-4" />
            תרגום
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Clock className="ml-2 h-4 w-4" />
            מתקדם
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות כלליות</CardTitle>
              <CardDescription>
                הגדרות בסיסיות של המערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>ערכת נושא</Label>
                <RadioGroup
                  value={settings.theme}
                  onValueChange={(value) =>
                    setSettings({ ...settings, theme: value })
                  }
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Label htmlFor="theme-light" className="cursor-pointer">בהיר</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Label htmlFor="theme-dark" className="cursor-pointer">כהה</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcription">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות תמלול</CardTitle>
              <CardDescription>
                התאם את הגדרות התמלול האוטומטי
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="whisper_model">מודל תמלול</Label>
                <Select
                  value={settings.whisper_model}
                  onValueChange={(value) =>
                    setSettings({ ...settings, whisper_model: value })
                  }
                >
                  <SelectTrigger id="whisper_model">
                    <SelectValue placeholder="בחר מודל תמלול" />
                  </SelectTrigger>
                  <SelectContent>
                    {WHISPER_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  מודל large-v3 הוא המדויק ביותר אך דורש יותר זמן עיבוד
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_language">שפת ברירת מחדל</Label>
                <Select
                  value={settings.default_language}
                  onValueChange={(value) =>
                    setSettings({ ...settings, default_language: value })
                  }
                >
                  <SelectTrigger id="default_language">
                    <SelectValue placeholder="בחר שפה" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  שפת ברירת המחדל לתמלול. מומלץ להשאיר על "זיהוי אוטומטי"
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>מודל</TableHead>
                    <TableHead>דיוק</TableHead>
                    <TableHead>מהירות</TableHead>
                    <TableHead>גודל</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">בסיסי</TableCell>
                    <TableCell>נמוך</TableCell>
                    <TableCell className="text-green-600">מהיר מאוד</TableCell>
                    <TableCell>74MB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">קטן</TableCell>
                    <TableCell>בינוני</TableCell>
                    <TableCell className="text-green-600">מהיר</TableCell>
                    <TableCell>244MB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">בינוני</TableCell>
                    <TableCell className="text-green-600">גבוה</TableCell>
                    <TableCell>בינוני</TableCell>
                    <TableCell>769MB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">גדול v3</TableCell>
                    <TableCell className="text-green-600">גבוה מאוד</TableCell>
                    <TableCell>איטי</TableCell>
                    <TableCell>2.9GB</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translation">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות תרגום</CardTitle>
              <CardDescription>
                הגדר אפשרויות תרגום אוטומטי
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_translate" className="text-base">
                    תרגום אוטומטי
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    תרגם תמלולים באופן אוטומטי בכל העלאה
                  </p>
                </div>
                <Switch
                  id="auto_translate"
                  checked={settings.auto_translate}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, auto_translate: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="default_translation_language">שפת תרגום ברירת מחדל</Label>
                <Select
                  value={settings.default_translation_language}
                  onValueChange={(value) =>
                    setSettings({ ...settings, default_translation_language: value })
                  }
                >
                  <SelectTrigger id="default_translation_language">
                    <SelectValue placeholder="בחר שפה" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.filter(lang => lang.code !== "auto").map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  שפת ברירת המחדל אליה יתורגמו התמלולים
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Languages className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium mb-1">תמיכה בשפות</h3>
                    <p className="text-sm text-muted-foreground">
                      המערכת תומכת בתרגום מכל שפה לכל שפה, כולל תרגום מעברית לאנגלית ולהיפך.
                      התרגום מתבצע באמצעות מודלים מתקדמים של בינה מלאכותית.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות מתקדמות</CardTitle>
              <CardDescription>
                הגדרות מתקדמות למשתמשים מנוסים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-destructive/10 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium mb-1">איפוס נתונים</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      אפשרות זו תמחק את כל הנתונים שלך, כולל תמלולים, הגדרות ופרופיל.
                      פעולה זו אינה הפיכה!
                    </p>
                    <Button variant="destructive" size="sm">
                      מחק את כל הנתונים
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}