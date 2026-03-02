import { useState } from 'react';
import { useStore } from '../store/useStore';
import { updateUserProfile, getProfileCompletionPercentage } from '../services/UserService';
import {
    User, Globe, Sprout, Save, Trash2, AlertTriangle, Database,
    Download, Upload, Cloud, CloudOff, RefreshCw, CheckCircle, LogOut,
    MapPin, GraduationCap, Building2, ChevronDown, ChevronUp
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useT } from '../i18n/useT';
import clsx from 'clsx';

export default function Settings() {
    const { user, updateUser, logout, isGuest } = useStore();
    const [isSaving, setIsSaving] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>('personal');


    // Form state - initialize with user data
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        middleName: user?.middleName || '',
        surname: user?.surname || '',
        dob: user?.dob || '',
        gender: user?.gender || undefined,
        maritalStatus: user?.maritalStatus || undefined,
        phone: user?.phone || '',
        email: user?.email || '',
        aadharNumber: user?.aadharNumber || '',
        correspondenceAddress: user?.correspondenceAddress || '',
        permanentAddress: user?.permanentAddress || '',
        qualification: user?.qualification || '',
        specialization: user?.specialization || '',
        instituteName: user?.instituteName || '',
        universityName: user?.universityName || '',
        farmSize: user?.farmSize || '5',
        crops: user?.crops || [],
        hasCompany: user?.hasCompany || false,
        companyName: user?.companyName || '',
        companyCIN: user?.companyCIN || '',
        companyAddress: user?.companyAddress || '',
        companyType: user?.companyType || undefined
    });

    if (!user) return <div className="p-8 text-center text-gray-500">Please log in first.</div>;

    const displayName = `${formData.firstName} ${formData.surname}`.trim() || 'User';
    const completionPercentage = getProfileCompletionPercentage(formData);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (user.id && !isGuest) {
                await updateUserProfile(user.id, formData);
            }
            updateUser(formData);
            alert('Profile saved successfully!');
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const commonCrops = ['Cotton', 'Soybean', 'Wheat', 'Rice', 'Sugarcane', 'Maize', 'Pulses', 'Vegetables'];

    const toggleCrop = (crop: string) => {
        const crops = formData.crops || [];
        if (crops.includes(crop)) {
            updateField('crops', crops.filter((c: string) => c !== crop));
        } else {
            updateField('crops', [...crops, crop]);
        }
    };

    const { t } = useT();

    return (
        <div className="min-h-screen bg-surface pb-24 md:pb-10 font-sans">
            <PageHeader
                icon={<User size={20} />}
                title={t('set.title')}
                subtitle={t('ph.settings')}
            />

            <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">

                {/* Profile Header */}
                <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(16,185,129,0.15)] group">
                    <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/30 transition-colors duration-500" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-500/20 rounded-full blur-[50px] pointer-events-none" />
                    <div className="absolute inset-0 border-[2px] border-white/10 rounded-[2rem] pointer-events-none" />

                    <div className="relative z-10 flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-1 shadow-lg shadow-emerald-500/30">
                            <div className="w-full h-full rounded-[20px] bg-white overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} alt="Profile" className="w-full h-full bg-slate-900" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-black text-2xl text-white tracking-tight leading-tight">{displayName}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={clsx(
                                    "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border",
                                    isGuest ? "bg-white/10 text-white/80 border-white/20" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                )}>
                                    {isGuest ? 'Guest Farmer' : 'Verified Farmer'}
                                </span>
                                {completionPercentage === 100 && (
                                    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">Pro Profile</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Completion */}
                    <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-inner">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Profile Strength</span>
                            </div>
                            <span className="text-sm font-black text-emerald-400 drop-shadow-sm">{completionPercentage}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-white/5 inset-shadow-sm">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] relative"
                                style={{ width: `${completionPercentage}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 w-full h-full" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Personal Information */}
                <CollapsibleSection
                    title="Personal Information"
                    icon={<User className="text-primary-600" />}
                    isExpanded={expandedSection === 'personal'}
                    onToggle={() => toggleSection('personal')}
                >
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name *</label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => updateField('firstName', e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Middle Name</label>
                            <input
                                type="text"
                                value={formData.middleName}
                                onChange={(e) => updateField('middleName', e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Surname *</label>
                            <input
                                type="text"
                                value={formData.surname}
                                onChange={(e) => updateField('surname', e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={(e) => updateField('dob', e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                            <select
                                value={formData.gender || ''}
                                onChange={(e) => updateField('gender', e.target.value || undefined)}
                                className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                            >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marital Status</label>
                        <select
                            value={formData.maritalStatus || ''}
                            onChange={(e) => updateField('maritalStatus', e.target.value || undefined)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Select status</option>
                            <option value="Married">Married</option>
                            <option value="Unmarried">Unmarried</option>
                        </select>
                    </div>
                </CollapsibleSection>

                {/* Contact & Address */}
                <CollapsibleSection
                    title="Contact & Address"
                    icon={<MapPin className="text-blue-600" />}
                    isExpanded={expandedSection === 'contact'}
                    onToggle={() => toggleSection('contact')}
                >
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => updateField('phone', e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aadhar Number</label>
                        <input
                            type="text"
                            value={formData.aadharNumber}
                            onChange={(e) => updateField('aadharNumber', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            maxLength={12}
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correspondence Address</label>
                        <textarea
                            value={formData.correspondenceAddress}
                            onChange={(e) => updateField('correspondenceAddress', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={3}
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Permanent Address</label>
                        <textarea
                            value={formData.permanentAddress}
                            onChange={(e) => updateField('permanentAddress', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={3}
                        />
                    </div>
                </CollapsibleSection>

                {/* Education */}
                <CollapsibleSection
                    title="Education & Professional"
                    icon={<GraduationCap className="text-purple-600" />}
                    isExpanded={expandedSection === 'education'}
                    onToggle={() => toggleSection('education')}
                >
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qualification</label>
                            <input
                                type="text"
                                value={formData.qualification}
                                onChange={(e) => updateField('qualification', e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specialization</label>
                            <input
                                type="text"
                                value={formData.specialization}
                                onChange={(e) => updateField('specialization', e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institute Name</label>
                        <input
                            type="text"
                            value={formData.instituteName}
                            onChange={(e) => updateField('instituteName', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">University Name</label>
                        <input
                            type="text"
                            value={formData.universityName}
                            onChange={(e) => updateField('universityName', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </CollapsibleSection>

                {/* Farm Details */}
                <CollapsibleSection
                    title="Farm Details"
                    icon={<Sprout className="text-green-600" />}
                    isExpanded={expandedSection === 'farm'}
                    onToggle={() => toggleSection('farm')}
                >
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Farm Size (Acres)</label>
                        <input
                            type="number"
                            value={formData.farmSize}
                            onChange={(e) => updateField('farmSize', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            min="0"
                            step="0.5"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Crops Grown</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {commonCrops.map(crop => (
                                <button
                                    key={crop}
                                    type="button"
                                    onClick={() => toggleCrop(crop)}
                                    className={`px-3 py-2.5 rounded-xl border-2 transition-all font-bold text-[13px] shadow-sm active:scale-95 ${formData.crops?.includes(crop)
                                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 text-emerald-700 shadow-emerald-100'
                                        : 'bg-white/80 border-white text-gray-600 hover:border-emerald-200 hover:shadow-md'
                                        }`}
                                >
                                    {crop}
                                </button>
                            ))}
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Business Information */}
                <CollapsibleSection
                    title="Business Information (Optional)"
                    icon={<Building2 className="text-orange-600" />}
                    isExpanded={expandedSection === 'business'}
                    onToggle={() => toggleSection('business')}
                >
                    <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.hasCompany}
                                onChange={(e) => updateField('hasCompany', e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-2 focus:ring-emerald-500 transition-colors"
                            />
                            <span className="text-sm font-medium text-gray-700">I have a registered company/firm</span>
                        </label>
                    </div>

                    {formData.hasCompany && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => updateField('companyName', e.target.value)}
                                    className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Type</label>
                                <select
                                    value={formData.companyType || ''}
                                    onChange={(e) => updateField('companyType', e.target.value || undefined)}
                                    className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                                >
                                    <option value="">Select type</option>
                                    <option value="Private Company">Private Company</option>
                                    <option value="Registered Partnership Firm">Registered Partnership Firm</option>
                                    <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company CIN</label>
                                <input
                                    type="text"
                                    value={formData.companyCIN}
                                    onChange={(e) => updateField('companyCIN', e.target.value)}
                                    className="w-full bg-white/60 backdrop-blur-sm border border-white rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white focus:bg-white focus:shadow-md"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Address</label>
                                <textarea
                                    value={formData.companyAddress}
                                    onChange={(e) => updateField('companyAddress', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                </CollapsibleSection>

                {/* ── Save Button ── */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-[1.25rem] font-black text-[16px] shadow-lg shadow-emerald-200/60 hover:shadow-xl hover:shadow-emerald-300/60 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0"
                >
                    {isSaving
                        ? <><RefreshCw size={20} className="animate-spin" /> {t('common.saving')}</>
                        : <><Save size={20} /> {t('set.saveProfile')}</>
                    }
                </button>

                {/* ── Language ── */}
                <section className="bg-gradient-to-br from-white via-emerald-50/20 to-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-[2px] border-white overflow-hidden transition-all duration-300 hover:shadow-[0_15px_40px_rgba(16,185,129,0.1)]">
                    <div className="px-6 py-5 flex items-center gap-4 border-b border-white/50 bg-white/40 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                            <Globe size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-black text-gray-900 tracking-tight">{t('set.language')}</h2>
                            <p className="text-[12px] text-gray-400 font-bold">{t('set.languageHint')}</p>
                        </div>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-4">
                        {[
                            { code: 'en' as const, script: 'A', name: 'English', sub: 'English' },
                            { code: 'mr' as const, script: 'अ', name: 'मराठी', sub: 'Marathi' },
                        ].map(({ code, script, name, sub }) => (
                            <button
                                key={code}
                                onClick={() => updateUser({ language: code })}
                                className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left active:scale-[0.98] ${user.language === code
                                    ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md shadow-emerald-100/50'
                                    : 'border-white bg-white/60 hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5'
                                    }`}
                            >
                                <span className={`text-[28px] font-black leading-none drop-shadow-sm ${user.language === code ? 'text-emerald-600' : 'text-gray-400'}`}>{script}</span>
                                <div>
                                    <p className={`text-[14px] font-black tracking-tight ${user.language === code ? 'text-emerald-800' : 'text-gray-700'}`}>{name}</p>
                                    <p className="text-[11px] text-gray-400 font-bold">{sub}</p>
                                </div>
                                {user.language === code && (
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-300/50">
                                        <CheckCircle size={12} className="text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── Cloud Sync ── */}
                <section className="bg-gradient-to-br from-white via-emerald-50/20 to-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-[2px] border-white overflow-hidden transition-all duration-300 hover:shadow-[0_15px_40px_rgba(16,185,129,0.1)]">
                    <div className="px-6 py-5 flex items-center gap-4 border-b border-white/50 bg-white/40 backdrop-blur-sm">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${import.meta.env.VITE_FIREBASE_API_KEY ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                            {import.meta.env.VITE_FIREBASE_API_KEY
                                ? <Cloud size={18} className="text-emerald-600" />
                                : <CloudOff size={18} className="text-orange-500" />
                            }
                        </div>
                        <div>
                            <h2 className="text-[15px] font-black text-gray-900 tracking-tight">{t('set.cloudSync')}</h2>
                            <p className="text-[12px] font-bold text-gray-400">
                                {import.meta.env.VITE_FIREBASE_API_KEY ? t('set.syncOn') : t('set.syncOff')}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm ${import.meta.env.VITE_FIREBASE_API_KEY ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                                {import.meta.env.VITE_FIREBASE_API_KEY ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>
                    {import.meta.env.VITE_FIREBASE_API_KEY && (
                        <div className="p-5">
                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        const { syncService } = await import('../services/SyncService');
                                        const count = await syncService.syncPendingLogs();
                                        alert(count > 0 ? `Synced ${count} logs to cloud!` : 'All data is already synced.');
                                    } catch (e) {
                                        alert('Sync failed. Check console.');
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                disabled={isSaving}
                                className="w-full bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-100 py-3.5 rounded-2xl font-bold text-[14px] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:from-emerald-100 hover:to-teal-100 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                <RefreshCw size={16} className={isSaving ? 'animate-spin' : ''} />
                                {isSaving ? 'Syncing...' : 'Sync Now'}
                            </button>
                        </div>
                    )}
                </section>

                {/* ── Data Management ── */}
                <section className="bg-gradient-to-br from-white via-emerald-50/20 to-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-[2px] border-white overflow-hidden transition-all duration-300 hover:shadow-[0_15px_40px_rgba(16,185,129,0.1)]">
                    <div className="px-6 py-5 flex items-center gap-4 border-b border-white/50 bg-white/40 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shadow-sm">
                            <Database size={18} className="text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-black text-gray-900 tracking-tight">Data Management</h2>
                            <p className="text-[12px] text-gray-400 font-bold">Export or import your diagnosis history</p>
                        </div>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-4">
                        <button
                            onClick={async () => {
                                const { syncService } = await import('../services/SyncService');
                                const blob = await syncService.exportData();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `crop-doctor-backup-${new Date().toISOString().split('T')[0]}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                            className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100 text-purple-700 font-bold text-[14px] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-purple-200 transition-all active:scale-[0.98]"
                        >
                            <Download size={18} /> Export JSON
                        </button>
                        <label className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 font-bold text-[14px] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition-all active:scale-[0.98] cursor-pointer">
                            <Upload size={18} /> Import Data
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                        if (confirm('Importing will add data to your current history. Continue?')) {
                                            try {
                                                const { syncService } = await import('../services/SyncService');
                                                const count = await syncService.importData(e.target.files[0]);
                                                alert(`Successfully restored ${count} diagnoses!`);
                                            } catch (err) {
                                                alert('Failed to restore data. Invalid file.');
                                                console.error(err);
                                            }
                                        }
                                    }
                                }}
                            />
                        </label>
                    </div>
                </section>

                {/* ── Account / Danger Zone ── */}
                <section className="bg-gradient-to-br from-white via-red-50/20 to-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-[2px] border-white overflow-hidden transition-all duration-300 hover:shadow-[0_15px_40px_rgba(239,68,68,0.1)]">
                    <div className="px-6 py-5 flex items-center gap-4 border-b border-white/50 bg-white/40 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 shadow-sm flex items-center justify-center">
                            <AlertTriangle size={18} className="text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-black text-gray-900 tracking-tight">{t('set.dangerZone')}</h2>
                            <p className="text-[12px] text-gray-400 font-bold">Irreversible actions — proceed with care</p>
                        </div>
                    </div>
                    <div className="p-5 space-y-3">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-white hover:bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                        >
                            <LogOut size={18} className="text-gray-500" />
                            <span className="text-[14px] font-black text-gray-700">{t('set.logout')}</span>
                        </button>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 hover:border-red-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                        >
                            <Trash2 size={18} className="text-red-500" />
                            <div className="text-left leading-tight">
                                <p className="text-[14px] font-black text-red-700 mb-0.5">Clear All Data & Reset</p>
                                <p className="text-[11px] text-red-400 font-bold">Clears history, settings — cannot be undone</p>
                            </div>
                        </button>
                    </div>
                </section>

                <div className="text-center text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] pb-4">
                    Crop Doctor v1.0.0 · AI-Powered
                </div>
            </div>
        </div>
    );
}

// Collapsible Section Component
function CollapsibleSection({ title, icon, isExpanded, onToggle, children }: any) {
    return (
        <section className="bg-gradient-to-br from-white via-emerald-50/20 to-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-[2px] border-white overflow-hidden transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full p-6 flex items-center justify-between hover:bg-white/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-emerald-50 flex items-center justify-center">
                        {icon}
                    </div>
                    <h2 className="text-[17px] font-black text-gray-900 tracking-tight">{title}</h2>
                </div>
                {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
            </button>

            {isExpanded && (
                <div className="px-6 pb-6 space-y-4 animate-fade-in">
                    {children}
                </div>
            )}
        </section>
    );
}
