"use client";

import Image from "next/image";
import { redirect } from "next/navigation";
import { useState, useRef } from "react";
import shopify from "@/public/onboarding/logos/shopify.png"
import meta from "@/public/onboarding/logos/meta_business.png"
import googleAnalytics from "@/public/onboarding/logos/google_analytics.png"
import excel from "@/public/onboarding/logos/excel.png"
import logo from "@/public/logo.png"
// ─── Types ────────────────────────────────────────────────────────────────────

interface BusinessData {
  name: string;
  tenantSlug: string;
  industry: string;
  location: string;
}

interface PlanData {
  planId: string;
  planName: string;
  price: number;
  duration: string;
}

interface SubscriptionData {
  renewalType: string;
  startDate: string;
}

interface TeamMember {
  email: string;
  role: string;
  permission: string;
}

interface ImportedFile {
  name: string;
  size: number;
  type: string;
  file: File; // actual File object preserved for pipeline upload
}

interface ConnectedPlatform {
  id: string;
  name: string;
  status: "connected" | "pending" | "error";
}

interface DataImportData {
  uploadedFiles: ImportedFile[];
  connectedPlatforms: ConnectedPlatform[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Fashion & Clothing"
];

const PLANS = [
  {
    id: "essential",
    name: "Essential",
    price: 1200,
    duration: "monthly",
    features: ["Up to 5 team members", "1,000 customers", "Basic analytics", "Email support"],
    accent: "#6EE7B7",
  },
  {
    id: "performance",
    name: "Performance",
    price: 3500,
    duration: "monthly",
    features: ["Up to 20 team members", "10,000 customers", "Advanced analytics", "Priority support", "Integrations", "AI Support"],
    accent: "#818CF8",
    popular: true,
  },
  {
    id: "enterprise",
    name: "enterprise",
    price: 10000,
    duration: "monthly",
    features: ["Unlimited team members", "Unlimited customers", "Custom analytics", "24/7 support", "All integrations", "Dedicated manager", "AI Support"],
    accent: "#FB923C",
  },
];

const ROLES = ["Owner", "Admin", "Manager", "Member", "Viewer"];
const PERMISSIONS = ["Full Access", "Edit", "View Only", "Custom"];

const PLATFORMS = [
  {
    id: "shopify",
    name: "Shopify",
    icon: <Image src={shopify} alt="shopify"/>,
    description: "Sync orders, products & customers",
    color: "#96BF48",
  },
  {
    id: "meta",
    name: "Meta Business",
    icon: <Image src={meta} alt="Meta Business"/>,
    description: "Import ad spend, campaigns & audiences",
    color: "#1877F2",
  },
  {
    id: "google",
    name: "Google Analytics",
    icon: <Image src={googleAnalytics} alt="Meta Business"/>,
    description: "Pull traffic, conversions & events",
    color: "#E37400",
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    icon: "🛒",
    description: "Import store data & transactions",
    color: "#7F54B3",
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: "💳",
    description: "Revenue, payments & subscriptions",
    color: "#635BFF",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    icon: "🔶",
    description: "CRM contacts, deals & pipelines",
    color: "#FF7A59",
  },
];

const ACCEPTED_FILE_TYPES = [
  ".xlsx", ".xls", ".csv", ".json", ".tsv"
];

// ─── Step Components ──────────────────────────────────────────────────────────

function StepBusiness({
  data,
  onChange,
}: {
  data: BusinessData;
  onChange: (d: BusinessData) => void;
}) {
  const handleSlugify = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  };

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Set up your business</h2>
        <p>Tell us about the business you're building with.</p>
      </div>

      <div className="form-grid">
        <div className="field full">
          <label>Business Name</label>
          <input
            type="text"
            placeholder="Acme Corporation"
            value={data.name}
            onChange={(e) => {
              const name = e.target.value;
              onChange({
                ...data,
                name,
                tenantSlug: data.tenantSlug === handleSlugify(data.name) ? handleSlugify(name) : data.tenantSlug,
              });
            }}
          />
        </div>

        <div className="field full">
          <label>Workspace URL</label>
          <div className="slug-field">
            <span className="slug-prefix">app.fuse.store/</span>
            <input
              type="text"
              placeholder="acme-corporation"
              value={data.tenantSlug}
              onChange={(e) => onChange({ ...data, tenantSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            />
          </div>
          <span className="field-hint">Lowercase letters, numbers, and hyphens only.</span>
        </div>

        <div className="field">
          <label>Industry</label>
          <select value={data.industry} onChange={(e) => onChange({ ...data, industry: e.target.value })}>
            <option value="">Select industry</option>
            {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Location</label>
          <input
            type="text"
            placeholder="Cairo, Alexandria"
            value={data.location}
            onChange={(e) => onChange({ ...data, location: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function StepPlan({
  data,
  onChange,
}: {
  data: PlanData;
  onChange: (d: PlanData) => void;
}) {
  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Choose your plan</h2>
        <p>Pick the plan that fits your team size and goals.</p>
      </div>

      <div className="plans-grid">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            className={`plan-card min-w-full ${data.planId === plan.id ? "selected" : ""} ${plan.popular ? "popular" : ""}`}
            style={{ "--plan-accent": plan.accent } as React.CSSProperties}
            onClick={() => onChange({ planId: plan.id, planName: plan.name, price: plan.price, duration: plan.duration })}
          >
            {plan.popular && <div className="popular-badge">Most Popular</div>}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">
              <span className="currency">EGP</span>
              <span className="amount">{plan.id === "enterprise" ? "Custom": plan.price}</span>
              <span className="period">/mo</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}>
                  <span className="check">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="plan-select-indicator">{data.planId === plan.id ? "Selected ✓" : "Select Plan"}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSubscription({
  data,
  onChange,
}: {
  data: SubscriptionData;
  onChange: (d: SubscriptionData) => void;
}) {
  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Subscription details</h2>
        <p>Configure when and how your subscription renews.</p>
      </div>

      <div className="form-grid">
        <div className="field full">
          <label>Renewal Type</label>
          <div className="renewal-options">
            {["automatic", "manual"].map((type) => (
              <button
                key={type}
                className={`renewal-option ${data.renewalType === type ? "selected" : ""}`}
                onClick={() => onChange({ ...data, renewalType: type })}
              >
                <span className="renewal-icon">{type === "automatic" ? "🔄" : "🖊️"}</span>
                <div>
                  <div className="renewal-title">{type === "automatic" ? "Automatic" : "Manual"}</div>
                  <div className="renewal-desc">
                    {type === "automatic"
                      ? "We'll automatically charge your card at renewal"
                      : "You'll receive an invoice to renew manually"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="field full">
          <label>Subscription Start Date</label>
          <input
            type="date"
            value={data.startDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => onChange({ ...data, startDate: e.target.value })}
          />
          <span className="field-hint">Your billing cycle will begin on this date.</span>
        </div>
      </div>
    </div>
  );
}

function StepTeam({
  members,
  onChange,
}: {
  members: TeamMember[];
  onChange: (m: TeamMember[]) => void;
}) {
  const addMember = () => {
    onChange([...members, { email: "", role: "Member", permission: "View Only" }]);
  };

  const removeMember = (i: number) => {
    onChange(members.filter((_, idx) => idx !== i));
  };

  const updateMember = (i: number, field: keyof TeamMember, value: string) => {
    onChange(members.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Invite your team</h2>
        <p>Add teammates to your workspace. You can always do this later.</p>
      </div>

      <div className="team-list">
        {members.map((member, i) => (
          <div key={i} className="team-member-row">
            <input
              type="email"
              placeholder="teammate@company.com"
              value={member.email}
              onChange={(e) => updateMember(i, "email", e.target.value)}
              className="member-email"
            />
            <select value={member.role} onChange={(e) => updateMember(i, "role", e.target.value)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select value={member.permission} onChange={(e) => updateMember(i, "permission", e.target.value)}>
              {PERMISSIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <button className="remove-btn" onClick={() => removeMember(i)}>✕</button>
          </div>
        ))}

        <button className="add-member-btn" onClick={addMember}>
          <span>+</span> Add team member
        </button>
      </div>

      <div className="skip-hint">
        You can skip this step and invite teammates from your dashboard later.
      </div>
    </div>
  );
}

function StepDataImport({
  data,
  onChange,
}: {
  data: DataImportData;
  onChange: (d: DataImportData) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: ImportedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
    }));
    onChange({ ...data, uploadedFiles: [...data.uploadedFiles, ...newFiles] });
  };

  const removeFile = (i: number) => {
    onChange({ ...data, uploadedFiles: data.uploadedFiles.filter((_, idx) => idx !== i) });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleConnectPlatform = (platformId: string) => {
    const already = data.connectedPlatforms.find((p) => p.id === platformId);
    if (already) {
      // Disconnect
      onChange({ ...data, connectedPlatforms: data.connectedPlatforms.filter((p) => p.id !== platformId) });
      return;
    }
    setConnectingId(platformId);
    // Simulate OAuth flow
    setTimeout(() => {
      onChange({
        ...data,
        connectedPlatforms: [
          ...data.connectedPlatforms,
          { id: platformId, name: PLATFORMS.find((p) => p.id === platformId)!.name, status: "connected" },
        ],
      });
      setConnectingId(null);
    }, 1800);
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") return "📊";
    if (ext === "csv") return "📋";
    if (ext === "json") return "📄";
    return "📁";
  };

  return (
    <div className="step-content import-step-content">
      <div className="step-header">
        <h2>Import your business data</h2>
        <p>Bring in existing data to hit the ground running. Upload files, connect platforms, or do both — all optional.</p>
      </div>

      {/* ── Section: File Upload ── */}
      <div className="import-section">
        <div className="import-section-label">
          <span className="section-badge"></span>
          <div>
            <div className="section-title flex items-end gap-1.5"><Image src={excel} alt="Excel Logo" width={40}/> Upload Excel Sheets</div>
            <div className="section-desc">we'll map your data automatically</div>
          </div>
        </div>

        <div
          className={`dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES.join(",")}
            style={{ display: "none" }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="dropzone-icon">{isDragging ? "📂" : "⬆️"}</div>
          <div className="dropzone-text">
            <strong>Drop files here</strong> or <span className="dropzone-link">browse</span>
          </div>
          <div className="dropzone-formats">Supports .xlsx, .xls, .csv</div>
        </div>

        {data.uploadedFiles.length > 0 && (
          <div className="file-list">
            {data.uploadedFiles.map((file, i) => (
              <div key={i} className="file-row">
                <span className="file-icon">{getFileIcon(file.name)}</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <div className="file-status">
                  <span className="file-ready">Ready to import</span>
                </div>
                <button className="remove-btn" onClick={() => removeFile(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="import-divider">
        <span>or connect a platform</span>
      </div>

      {/* ── Section: Platform Integrations ── */}
      <div className="import-section">
        <div className="import-section-label">
          <span className="section-badge">🔌</span>
          <div>
            <div className="section-title">Connect platforms</div>
            <div className="section-desc">One-click integrations to sync your existing data</div>
          </div>
        </div>

        <div className="platforms-grid">
          {PLATFORMS.map((platform) => {
            const connected = data.connectedPlatforms.find((p) => p.id === platform.id);
            const isConnecting = connectingId === platform.id;
            return (
              <button
                key={platform.id}
                className={`flex flex-col justify-between platform-card ${connected ? "connected" : ""} ${isConnecting ? "connecting" : ""}`}
                style={{ "--platform-color": platform.color } as React.CSSProperties}
                onClick={() => handleConnectPlatform(platform.id)}
                disabled={isConnecting}
              >
                <div className="platform-header w-full min-h-45.5 h-[80%]">
                  <span className="platform-icon">{platform.icon}</span>
                  <div className="platform-status-indicator">
                    {connected ? (
                      <span className="status-dot connected-dot">✓</span>
                    ) : isConnecting ? (
                      <span className="status-dot connecting-dot">⟳</span>
                    ) : null}
                  </div>
                </div>
                <div className="h-[30%]">
                    <div className="platform-name">{platform.name}</div>
                    <div className="platform-desc">{platform.description}</div>
                    <div className={`platform-btn-label ${connected ? "disconnect" : ""}`}>
                    {connected ? "Connected — Disconnect" : isConnecting ? "Connecting…" : "Connect →"}
                    </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {(data.uploadedFiles.length > 0 || data.connectedPlatforms.length > 0) && (
        <div className="import-summary">
          <span className="import-summary-icon">✅</span>
          <span>
            {[
              data.uploadedFiles.length > 0 && `${data.uploadedFiles.length} file${data.uploadedFiles.length > 1 ? "s" : ""} ready`,
              data.connectedPlatforms.length > 0 && `${data.connectedPlatforms.length} platform${data.connectedPlatforms.length > 1 ? "s" : ""} connected`,
            ].filter(Boolean).join(" · ")}
          </span>
        </div>
      )}

      <div className="skip-hint">All data import is optional. You can always add sources from your dashboard later.</div>
    </div>
  );
}

function StepReview({
  business,
  plan,
  subscription,
  teamMembers,
  dataImport,
}: {
  business: BusinessData;
  plan: PlanData;
  subscription: SubscriptionData;
  teamMembers: TeamMember[];
  dataImport: DataImportData;
}) {
  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Ready to launch</h2>
        <p>Review your setup before we create your workspace.</p>
      </div>

      <div className="review-sections">
        <div className="review-card">
          <div className="review-card-title">🏢 Business</div>
          <div className="review-row"><span>Name</span><strong>{business.name || "—"}</strong></div>
          <div className="review-row"><span>Slug</span><strong>{business.tenantSlug || "—"}</strong></div>
          <div className="review-row"><span>Industry</span><strong>{business.industry || "—"}</strong></div>
          <div className="review-row"><span>Location</span><strong>{business.location || "—"}</strong></div>
        </div>

        <div className="review-card">
          <div className="review-card-title">💎 Plan</div>
          <div className="review-row"><span>Plan</span><strong>{plan.planName || "—"}</strong></div>
          <div className="review-row"><span>Price</span><strong>${plan.price}/mo</strong></div>
          <div className="review-row"><span>Renewal</span><strong style={{ textTransform: "capitalize" }}>{subscription.renewalType || "—"}</strong></div>
          <div className="review-row"><span>Start Date</span><strong>{subscription.startDate || "—"}</strong></div>
        </div>

        {teamMembers.length > 0 && (
          <div className="review-card">
            <div className="review-card-title">👥 Team ({teamMembers.length} invited)</div>
            {teamMembers.map((m, i) => (
              <div key={i} className="review-row">
                <span>{m.email || "No email"}</span>
                <strong>{m.role} · {m.permission}</strong>
              </div>
            ))}
          </div>
        )}

        {(dataImport.uploadedFiles.length > 0 || dataImport.connectedPlatforms.length > 0) && (
          <div className="review-card">
            <div className="review-card-title">📦 Data Import</div>
            {dataImport.uploadedFiles.map((f, i) => (
              <div key={i} className="review-row">
                <span>📊 {f.name}</span>
                <strong>Queued</strong>
              </div>
            ))}
            {dataImport.connectedPlatforms.map((p, i) => (
              <div key={i} className="review-row">
                <span>🔌 {p.name}</span>
                <strong style={{ color: "#6EE7B7" }}>Connected</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const STEPS = [
  { id: "business", label: "Business" },
  { id: "plan", label: "Plan" },
  { id: "subscription", label: "Billing" },
  { id: "team", label: "Team" },
  { id: "import", label: "Import" },
  { id: "review", label: "Review" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const [business, setBusiness] = useState<BusinessData>({ name: "", tenantSlug: "", industry: "", location: "" });
  const [plan, setPlan] = useState<PlanData>({ planId: "", planName: "", price: 0, duration: "monthly" });
  const [subscription, setSubscription] = useState<SubscriptionData>({
    renewalType: "automatic",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dataImport, setDataImport] = useState<DataImportData>({
    uploadedFiles: [],
    connectedPlatforms: [],
  });
  const [submitting, setSubmitting] = useState(false)

  const canProceed = () => {
    if (currentStep === 0) return business.name && business.tenantSlug && business.industry && business.location;
    if (currentStep === 1) return !!plan.planId;
    if (currentStep === 2) return subscription.renewalType && subscription.startDate;
    return true; // team, import, review are all skippable
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true)   // ← add this
    try {
      const firstFile = dataImport.uploadedFiles[0]?.file ?? null

      if (firstFile) {
        const formData = new FormData()
        formData.append("file", firstFile)
        const uploadRes = await fetch("/api/onboarding/upload", {
          method: "POST",
          body:   formData,
        })
        if (uploadRes.ok) {
          const { file_id, filename } = await uploadRes.json()
          sessionStorage.setItem("fuse_import_file_id", file_id)
          sessionStorage.setItem("fuse_import_filename", filename)
        }
      }

      await fetch("/api/businesses/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name: business.name, tenantSlug: business.tenantSlug,
          industry: business.industry, location: business.location,
          plan, subscription, teamMembers,
        }),
      })

      setCompleted(true)
      redirect("/onboarding/sync")
    } finally {
      setSubmitting(false)
    }
  }

  if (completed) {
    return (
      <>
        <style>{styles}</style>
        <div className="onboarding-root">
          <div className="success-screen">
            <div className="success-animation">🎉</div>
            <h1>You're all set!</h1>
            <p>
              <strong>{business.name}</strong> is ready. Your workspace is being provisioned.
            </p>
            <a href="/dashboard" className="dashboard-btn">Go to Dashboard →</a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="onboarding-root">
        <div className="onboarding-shell">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="logo"><Image src={logo} alt="Fuse Logo" width={35}/></div>
            <div className="steps-nav">
              {STEPS.map((step, i) => (
                <button
                  key={step.id}
                  className={`step-nav-item ${i === currentStep ? "active" : ""} ${i < currentStep ? "done" : ""} ${i > currentStep ? "locked" : ""}`}
                  onClick={() => i < currentStep && setCurrentStep(i)}
                >
                  <span className="step-num">{i < currentStep ? "✓" : i + 1}</span>
                  <span>{step.label}</span>
                </button>
              ))}
            </div>
            <div className="sidebar-footer">
              <div className="help-block">
                <div className="help-icon">?</div>
                <div>
                  <div className="help-title">Need help?</div>
                  <div className="help-link">Contact support</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="main-area">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${((currentStep) / (STEPS.length - 1)) * 100}%` }} />
            </div>

            <div className="step-wrapper">
              {currentStep === 0 && <StepBusiness data={business} onChange={setBusiness} />}
              {currentStep === 1 && <StepPlan data={plan} onChange={setPlan} />}
              {currentStep === 2 && <StepSubscription data={subscription} onChange={setSubscription} />}
              {currentStep === 3 && <StepTeam members={teamMembers} onChange={setTeamMembers} />}
              {currentStep === 4 && <StepDataImport data={dataImport} onChange={setDataImport} />}
              {currentStep === 5 && (
                <StepReview
                  business={business}
                  plan={plan}
                  subscription={subscription}
                  teamMembers={teamMembers}
                  dataImport={dataImport}
                />
              )}
            </div>

            <div className="footer-nav">
              {currentStep > 0 && (
                <button className="btn-back" onClick={() => setCurrentStep((s) => s - 1)}>
                  ← Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                className="btn-next"
                onClick={handleNext}
                disabled={!canProceed() || submitting}
              >
                {submitting
                  ? "Setting up your workspace…"
                  : currentStep === STEPS.length - 1
                    ? "Launch Workspace 🚀"
                    : "Continue →"
                }
              </button>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,300&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #fff;
    --surface: #fff;
    --surface2: #F9FAFB;
    --border: #E5E7EB;
    --text: #000;
    --muted: #7878A0;
    --accent: #3344FC;
    --accent2: #5BDBB0;
    --danger: #F87171;
    --font-display: 'Inter', serif;
    --font-body: 'DM Sans', sans-serif;
    --radius: 12px;
    --radius-sm: 8px;
  }

  body { font-family: var(--font-body); background: var(--bg); color: var(--text); }

  .onboarding-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg);
    background-image: radial-gradient(ellipse at 20% 30%, rgba(124,106,245,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 70%, rgba(91,219,176,0.06) 0%, transparent 60%);
  }

  .onboarding-shell {
    display: flex;
    width: 100%;
    max-width: 980px;
    min-height: 640px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--bg);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 32px 20px;
    gap: 32px;
  }

  .logo {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -0.5px;
  }

  .steps-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .step-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--muted);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }
  .step-nav-item.done { color: var(--accent2); cursor: pointer; }
  .step-nav-item.done:hover { background: rgba(91,219,176,0.06); }
  .step-nav-item.active { background: rgba(124,106,245,0.12); color: var(--text); font-weight: 500; }
  .step-nav-item.locked { cursor: default; }

  .step-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--surface2);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .step-nav-item.active .step-num { background: var(--accent); border-color: var(--accent); color: #fff; }
  .step-nav-item.done .step-num { background: var(--accent2); border-color: var(--accent2); color: #000; }

  .sidebar-footer { margin-top: auto; }

  .help-block {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .help-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--surface2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--muted);
    flex-shrink: 0;
  }

  .help-title { font-size: 12px; font-weight: 500; margin-bottom: 2px; }
  .help-link { font-size: 11px; color: var(--accent); cursor: pointer; }

  /* ── Main Area ── */
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .progress-bar {
    height: 3px;
    background: var(--surface2);
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    transition: width 0.4s ease;
  }

  .step-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 40px 48px;
  }

  /* ── Step Content ── */
  .step-content { max-width: 100%; }
  .import-step-content { max-width: 680px; }

  .step-header { margin-bottom: 36px; }
  .step-icon { font-size: 32px; margin-bottom: 12px; }
  .step-header h2 {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }
  .step-header p { color: var(--muted); font-size: 15px; }

  /* ── Form ── */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .field { display: flex; flex-direction: column; gap: 6px; }
  .field.full { grid-column: 1 / -1; }

  label { font-size: 13px; font-weight: 500; color: var(--text); }

  input[type="text"],
  input[type="email"],
  input[type="date"],
  select,
  textarea {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: var(--text);
    font-family: var(--font-body);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  input:focus, select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124,106,245,0.15);
  }
  input::placeholder { color: var(--muted); }
  select option { background: var(--surface2); }

  .slug-field {
    display: flex;
    align-items: center;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .slug-field:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124,106,245,0.15);
  }
  .slug-prefix {
    padding: 10px 10px 10px 14px;
    color: var(--muted);
    font-size: 13px;
    white-space: nowrap;
    border-right: 1px solid var(--border);
  }
  .slug-field input {
    border: none;
    background: transparent;
    box-shadow: none;
    flex: 1;
    min-width: 0;
    border-radius: 0;
  }
  .slug-field input:focus { box-shadow: none; }

  .field-hint { font-size: 12px; color: var(--muted); }

  /* ── Plan Cards ── */
  .plans-grid {
    display: grid;
    width: 100%;
    min-width: 100%;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .plan-card {
    background: var(--surface2);
    width: 100%;
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 24px 20px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    position: relative;
    font-family: var(--font-body);
    color: var(--text);
  }
  .plan-card:hover { border-color: var(--plan-accent, var(--accent)); transform: translateY(-2px); }
  .plan-card.selected {
    border-color: var(--plan-accent, var(--accent));
    background: color-mix(in srgb, var(--plan-accent) 6%, var(--surface2));
    box-shadow: 0 0 0 1px var(--plan-accent, var(--accent));
  }

  .popular-badge {
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--plan-accent, var(--accent));
    color: #000;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 0 0 8px 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .plan-name { font-size: 14px; font-weight: 600; color: var(--muted); margin-bottom: 8px; }
  .plan-price { margin-bottom: 20px; line-height: 1; }
  .plan-price .currency { font-size: 16px; color: var(--muted); vertical-align: top; margin-top: 6px; display: inline-block; }
  .plan-price .amount { font-family: var(--font-display); font-size: 40px; font-weight: 700; }
  .plan-price .period { font-size: 13px; color: var(--muted); }

  .plan-features { list-style: none; display: flex; flex-direction: column; gap: 7px; margin-bottom: 20px; }
  .plan-features li { font-size: 12px; color: var(--muted); display: flex; align-items: flex-start; gap: 6px; }
  .plan-features .check { color: var(--plan-accent, var(--accent)); flex-shrink: 0; font-weight: 700; }

  .plan-select-indicator {
    font-size: 12px;
    font-weight: 600;
    color: var(--plan-accent, var(--muted));
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  /* ── Subscription / Renewal ── */
  .renewal-options { display: flex; flex-direction: column; gap: 10px; }
  .renewal-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: var(--surface2);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    text-align: left;
    font-family: var(--font-body);
    color: var(--text);
    transition: all 0.2s;
  }
  .renewal-option:hover { border-color: var(--accent); }
  .renewal-option.selected { border-color: var(--accent); background: rgba(124,106,245,0.06); }
  .renewal-icon { font-size: 20px; flex-shrink: 0; }
  .renewal-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
  .renewal-desc { font-size: 12px; color: var(--muted); }

  /* ── Team ── */
  .team-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }

  .team-member-row {
    display: grid;
    grid-template-columns: 1fr 130px 130px 36px;
    gap: 8px;
    align-items: center;
  }

  .remove-btn {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--muted);
    cursor: pointer;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    transition: all 0.2s;
  }
  .remove-btn:hover { border-color: var(--danger); color: var(--danger); }

  .add-member-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: transparent;
    border: 1px dashed var(--border);
    border-radius: var(--radius-sm);
    color: var(--muted);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 14px;
    transition: all 0.2s;
    width: 100%;
  }
  .add-member-btn:hover { border-color: var(--accent); color: var(--accent); }
  .add-member-btn span { font-size: 18px; }

  .skip-hint { font-size: 13px; color: var(--muted); margin-top: 8px; }

  /* ── Data Import Step ── */
  .import-section {
    margin-bottom: 8px;
  }

  .import-section-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }

  .section-badge {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 2px;
  }

  .section-desc {
    font-size: 13px;
    color: var(--muted);
  }

  /* Dropzone */
  .dropzone {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 32px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--surface2);
    margin-bottom: 12px;
  }
  .dropzone:hover, .dropzone.dragging {
    border-color: var(--accent);
    background: rgba(51,68,252,0.03);
  }
  .dropzone-icon { font-size: 28px; margin-bottom: 8px; }
  .dropzone-text { font-size: 14px; color: var(--muted); margin-bottom: 4px; }
  .dropzone-text strong { color: var(--text); }
  .dropzone-link { color: var(--accent); text-decoration: underline; cursor: pointer; }
  .dropzone-formats { font-size: 12px; color: var(--muted); }

  /* File list */
  .file-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 4px;
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }

  .file-icon { font-size: 20px; flex-shrink: 0; }

  .file-info { flex: 1; min-width: 0; }
  .file-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .file-size { font-size: 11px; color: var(--muted); }

  .file-status { flex-shrink: 0; }
  .file-ready {
    font-size: 11px;
    font-weight: 600;
    color: var(--accent2);
    background: rgba(91,219,176,0.12);
    padding: 3px 8px;
    border-radius: 20px;
  }

  /* Import divider */
  .import-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 24px 0;
    color: var(--muted);
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .import-divider::before, .import-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* Platform grid */
  .platforms-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .platform-card {
    background: var(--surface2);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 14px;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-body);
    color: var(--text);
    transition: all 0.2s;
    position: relative;
  }
  .platform-card:hover:not(:disabled) {
    border-color: var(--platform-color, var(--accent));
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }
  .platform-card.connected {
    border-color: var(--platform-color, var(--accent));
    background: color-mix(in srgb, var(--platform-color) 5%, var(--surface2));
  }
  .platform-card.connecting {
    opacity: 0.7;
    cursor: wait;
  }

  .platform-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .platform-icon { font-size: 24px; }

  .status-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
  }
  .connected-dot {
    background: var(--accent2);
    color: #000;
  }
  .connecting-dot {
    background: var(--border);
    color: var(--muted);
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .platform-name { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
  .platform-desc { font-size: 11px; color: var(--muted); margin-bottom: 12px; line-height: 1.4; }

  .platform-btn-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--platform-color, var(--accent));
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .platform-btn-label.disconnect { color: var(--danger); }

  /* Import summary */
  .import-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(91,219,176,0.08);
    border: 1px solid rgba(91,219,176,0.3);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    color: #1a6b52;
    margin-top: 16px;
    margin-bottom: 8px;
  }
  .import-summary-icon { font-size: 16px; }

  /* ── Review ── */
  .review-sections { display: flex; flex-direction: column; gap: 16px; }
  .review-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
  }
  .review-card-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .review-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
  }
  .review-row:last-child { border-bottom: none; }
  .review-row span { color: var(--muted); }
  .review-row strong { color: var(--text); }

  /* ── Footer Nav ── */
  .footer-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 48px;
    border-top: 1px solid var(--border);
  }

  .btn-back {
    padding: 10px 20px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--muted);
    font-family: var(--font-body);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-back:hover { color: var(--text); border-color: var(--text); }

  .btn-next {
    padding: 11px 28px;
    background: var(--accent);
    border: none;
    border-radius: var(--radius-sm);
    color: #fff;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.2px;
  }
  .btn-next:hover:not(:disabled) { background: #6858e0; transform: translateY(-1px); }
  .btn-next:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Success ── */
  .success-screen {
    text-align: center;
    padding: 80px 40px;
    max-width: 400px;
  }
  .success-animation { font-size: 64px; margin-bottom: 24px; animation: pop 0.5s ease; }
  @keyframes pop {
    0% { transform: scale(0); opacity: 0; }
    80% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  .success-screen h1 {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  .success-screen p { color: var(--muted); font-size: 16px; margin-bottom: 32px; }
  .success-screen strong { color: var(--text); }
  .dashboard-btn {
    display: inline-block;
    padding: 14px 32px;
    background: var(--accent);
    color: #fff;
    text-decoration: none;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s;
  }
  .dashboard-btn:hover { background: #6858e0; transform: translateY(-1px); }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .onboarding-shell { flex-direction: column; }
    .sidebar { width: 100%; flex-direction: row; align-items: center; padding: 16px 20px; gap: 0; border-right: none; border-bottom: 1px solid var(--border); }
    .steps-nav { flex-direction: row; gap: 8px; }
    .step-nav-item span:last-child { display: none; }
    .sidebar-footer { display: none; }
    .step-wrapper { padding: 28px 24px; }
    .footer-nav { padding: 16px 24px; }
    .plans-grid { grid-template-columns: 1fr; }
    .platforms-grid { grid-template-columns: repeat(2, 1fr); }
    .team-member-row { grid-template-columns: 1fr 36px; }
    .team-member-row select { display: none; }
    .form-grid { grid-template-columns: 1fr; }
    .field.full { grid-column: 1; }
  }

  @media (max-width: 480px) {
    .platforms-grid { grid-template-columns: 1fr; }
  }
`;