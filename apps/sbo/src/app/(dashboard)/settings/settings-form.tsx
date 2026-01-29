"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Upload, Trash2, Building2, CreditCard, Link as LinkIcon, Eye, EyeOff } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  companyAddress: string | null;
  companyCity: string | null;
  companyPostalCode: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  companyLogo: string | null;
  kvkNumber: string | null;
  btwNumber: string | null;
  ibanNumber: string | null;
  defaultMarkup: number;
  defaultLaborRate: number;
  erpnextUrl: string | null;
  erpnextApiKey: string | null;
  erpnextApiSecret: string | null;
}

interface SettingsFormProps {
  user: User;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: user.name || "",
    companyName: user.companyName || "",
    companyAddress: user.companyAddress || "",
    companyCity: user.companyCity || "",
    companyPostalCode: user.companyPostalCode || "",
    companyPhone: user.companyPhone || "",
    companyEmail: user.companyEmail || "",
    companyWebsite: user.companyWebsite || "",
    companyLogo: user.companyLogo || "",
    kvkNumber: user.kvkNumber || "",
    btwNumber: user.btwNumber || "",
    ibanNumber: user.ibanNumber || "",
    defaultMarkup: user.defaultMarkup.toString(),
    defaultLaborRate: user.defaultLaborRate.toString(),
    erpnextUrl: user.erpnextUrl || "",
    erpnextApiKey: user.erpnextApiKey || "",
    erpnextApiSecret: user.erpnextApiSecret || "",
  });

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        updateField("companyLogo", data.url);
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveLogo() {
    updateField("companyLogo", "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          defaultMarkup: parseFloat(formData.defaultMarkup) || 10,
          defaultLaborRate: parseFloat(formData.defaultLaborRate) || 45,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bedrijfslogo
          </CardTitle>
          <CardDescription>
            Upload je bedrijfslogo voor gebruik op offertes en rapporten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {formData.companyLogo ? (
                <div className="relative">
                  <img
                    src={formData.companyLogo}
                    alt="Bedrijfslogo"
                    className="h-24 w-auto object-contain border rounded-lg p-2"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveLogo}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-24 w-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  Geen logo
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Logo uploaden
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG of SVG. Max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bedrijfsgegevens</CardTitle>
          <CardDescription>
            Deze gegevens worden gebruikt op offertes en facturen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contactpersoon</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Jan Jansen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Bedrijfsnaam</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="Bouwbedrijf B.V."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Adres</Label>
            <Input
              id="companyAddress"
              value={formData.companyAddress}
              onChange={(e) => updateField("companyAddress", e.target.value)}
              placeholder="Hoofdstraat 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyPostalCode">Postcode</Label>
              <Input
                id="companyPostalCode"
                value={formData.companyPostalCode}
                onChange={(e) => updateField("companyPostalCode", e.target.value)}
                placeholder="1234 AB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCity">Plaats</Label>
              <Input
                id="companyCity"
                value={formData.companyCity}
                onChange={(e) => updateField("companyCity", e.target.value)}
                placeholder="Amsterdam"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Telefoon</Label>
              <Input
                id="companyPhone"
                value={formData.companyPhone}
                onChange={(e) => updateField("companyPhone", e.target.value)}
                placeholder="020-1234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">E-mail</Label>
              <Input
                id="companyEmail"
                type="email"
                value={formData.companyEmail}
                onChange={(e) => updateField("companyEmail", e.target.value)}
                placeholder="info@bedrijf.nl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Website</Label>
            <Input
              id="companyWebsite"
              value={formData.companyWebsite}
              onChange={(e) => updateField("companyWebsite", e.target.value)}
              placeholder="www.bedrijf.nl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Financiele gegevens
          </CardTitle>
          <CardDescription>
            Registratienummers en bankgegevens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kvkNumber">KvK-nummer</Label>
              <Input
                id="kvkNumber"
                value={formData.kvkNumber}
                onChange={(e) => updateField("kvkNumber", e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="btwNumber">BTW-nummer</Label>
              <Input
                id="btwNumber"
                value={formData.btwNumber}
                onChange={(e) => updateField("btwNumber", e.target.value)}
                placeholder="NL123456789B01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ibanNumber">IBAN</Label>
            <Input
              id="ibanNumber"
              value={formData.ibanNumber}
              onChange={(e) => updateField("ibanNumber", e.target.value)}
              placeholder="NL00 BANK 0123 4567 89"
            />
          </div>

        </CardContent>
      </Card>

      {/* Default Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Standaardwaarden</CardTitle>
          <CardDescription>
            Standaardinstellingen voor nieuwe begrotingen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultLaborRate">Standaard uurtarief</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
                <Input
                  id="defaultLaborRate"
                  type="number"
                  step="0.01"
                  value={formData.defaultLaborRate}
                  onChange={(e) => updateField("defaultLaborRate", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultMarkup">Standaard opslag</Label>
              <div className="relative">
                <Input
                  id="defaultMarkup"
                  type="number"
                  step="0.1"
                  value={formData.defaultMarkup}
                  onChange={(e) => updateField("defaultMarkup", e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ERPNext Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            ERPNext Integratie
          </CardTitle>
          <CardDescription>
            Koppel je ERPNext account om projecten en klantgegevens te importeren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="erpnextUrl">ERPNext URL</Label>
            <Input
              id="erpnextUrl"
              value={formData.erpnextUrl}
              onChange={(e) => updateField("erpnextUrl", e.target.value)}
              placeholder="https://jouw-bedrijf.erpnext.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="erpnextApiKey">API Key</Label>
              <Input
                id="erpnextApiKey"
                value={formData.erpnextApiKey}
                onChange={(e) => updateField("erpnextApiKey", e.target.value)}
                placeholder="API Key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="erpnextApiSecret">API Secret</Label>
              <div className="relative">
                <Input
                  id="erpnextApiSecret"
                  type={showApiSecret ? "text" : "password"}
                  value={formData.erpnextApiSecret}
                  onChange={(e) => updateField("erpnextApiSecret", e.target.value)}
                  placeholder="API Secret"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                >
                  {showApiSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Je vindt je API credentials in ERPNext onder Settings &gt; API Access.
          </p>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Instellingen opslaan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
