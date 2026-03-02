import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { updateUserProfile, checkProfileComplete } from '../services/UserService';
import { User, MapPin, GraduationCap, Building2, Sprout, ArrowRight, ArrowLeft, CheckCircle2, Lightbulb } from 'lucide-react';

export default function ProfileSetup() {
    const navigate = useNavigate();
    const { user, updateUser } = useStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        middleName: user?.middleName || '',
        surname: user?.surname || '',
        dob: user?.dob || '',
        gender: (user?.gender || undefined) as 'Male' | 'Female' | 'Other' | undefined,
        maritalStatus: (user?.maritalStatus || undefined) as 'Married' | 'Unmarried' | undefined,
        category: (user?.category || 'General') as 'General' | 'OBC' | 'SC' | 'ST',
        isBPL: user?.isBPL || false,
        phone: user?.phone || '',
        email: user?.email || '',
        aadharNumber: user?.aadharNumber || '',
        correspondenceAddress: user?.correspondenceAddress || '',
        permanentAddress: user?.permanentAddress || '',
        sameAsCorrespondence: false,
        qualification: user?.qualification || '',
        specialization: user?.specialization || '',
        instituteName: user?.instituteName || '',
        universityName: user?.universityName || '',
        farmSize: user?.farmSize || '5',
        crops: user?.crops || [] as string[],
        hasCompany: user?.hasCompany || false,
        companyName: user?.companyName || '',
        companyCIN: user?.companyCIN || '',
        companyAddress: user?.companyAddress || '',
        companyType: user?.companyType || undefined,
        // Project Details
        projectTheme: user?.projectTheme || 'AI & IoT',
        projectConcept: user?.projectConcept || '',
        productName: user?.productName || '',
        innovationDescription: user?.innovationDescription || '',
        hasPatent: user?.hasPatent || false,
        patentNumber: user?.patentNumber || '',
        primaryCustomer: user?.primaryCustomer || '',
        marketOpportunity: user?.marketOpportunity || '',
        revenueModel: user?.revenueModel || ''
    });

    const totalSteps = 6;

    const handleNext = async () => {
        if (step < totalSteps) {
            setStep(step + 1);
            await saveProgress();
        } else {
            await handleComplete();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const saveProgress = async () => {
        if (!user?.id) return;

        try {
            await updateUserProfile(user.id, {
                ...formData,
                profileComplete: false
            });
            updateUser(formData);
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    };

    const handleComplete = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const profileData = {
                ...formData,
                profileComplete: checkProfileComplete(formData)
            };

            await updateUserProfile(user.id, profileData);
            updateUser(profileData);
            navigate('/');
        } catch (error) {
            console.error('Failed to complete profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-12">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-600">Step {step} of {totalSteps}</span>
                        <span className="text-sm font-bold text-primary-600">{Math.round((step / totalSteps) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-300"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                {step === 1 && <Step1Personal formData={formData} updateField={updateField} />}
                {step === 2 && <Step2Contact formData={formData} updateField={updateField} />}
                {step === 3 && <Step3Education formData={formData} updateField={updateField} />}
                {step === 4 && <Step4Farm formData={formData} updateField={updateField} />}
                {step === 5 && <Step5Business formData={formData} updateField={updateField} />}
                {step === 6 && <Step6Project formData={formData} updateField={updateField} />}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-8">
                    {step > 1 && (
                        <button
                            onClick={handleBack}
                            className="flex-1 btn-secondary py-3 md:py-4 flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <ArrowLeft size={20} />
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="flex-1 btn-primary py-3 md:py-4 flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                        {loading ? 'Saving...' : step === totalSteps ? 'Complete Profile' : 'Next'}
                        {!loading && (step === totalSteps ? <CheckCircle2 size={20} /> : <ArrowRight size={20} />)}
                    </button>
                </div>

                {/* Skip Option */}
                <button
                    onClick={() => navigate('/')}
                    className="w-full mt-4 text-gray-500 text-xs md:text-sm hover:text-gray-700 transition-colors"
                >
                    Skip for now (you can complete this later in Settings)
                </button>
            </div>
        </div>
    );
}

// Step 1: Personal Information
function Step1Personal({ formData, updateField }: any) {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <User className="text-primary-600" size={28} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-500">Tell us about yourself</p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 md:gap-4">
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">First Name *</label>
                    <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        placeholder="Enter first name"
                    />
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Middle Name</label>
                    <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => updateField('middleName', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        placeholder="Optional"
                    />
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Surname *</label>
                    <input
                        type="text"
                        value={formData.surname}
                        onChange={(e) => updateField('surname', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        placeholder="Enter surname"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Date of Birth *</label>
                    <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => updateField('dob', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    />
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Gender *</label>
                    <select
                        value={formData.gender || ''}
                        onChange={(e) => updateField('gender', e.target.value || undefined)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Social Category *</label>
                    <select
                        value={formData.category}
                        onChange={(e) => updateField('category', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    >
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer mt-6">
                        <input
                            type="checkbox"
                            checked={formData.isBPL}
                            onChange={(e) => updateField('isBPL', e.target.checked)}
                            className="w-5 h-5 text-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-sm font-bold text-gray-700">Are you BPL? (Below Poverty Line)</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

// Step 2: Contact & Address
function Step2Contact({ formData, updateField }: any) {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <MapPin className="text-primary-600" size={28} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Contact & Address</h2>
                <p className="text-sm text-gray-500">How can we reach you?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        placeholder="10-digit mobile"
                    />
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        placeholder="your@email.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Aadhar Number</label>
                <input
                    type="text"
                    value={formData.aadharNumber}
                    onChange={(e) => updateField('aadharNumber', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    placeholder="12-digit Aadhar"
                    maxLength={12}
                />
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Correspondence Address *</label>
                <textarea
                    value={formData.correspondenceAddress}
                    onChange={(e) => updateField('correspondenceAddress', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    rows={3}
                    placeholder="Enter your current address"
                />
            </div>

            <div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.sameAsCorrespondence}
                        onChange={(e) => {
                            updateField('sameAsCorrespondence', e.target.checked);
                            if (e.target.checked) {
                                updateField('permanentAddress', formData.correspondenceAddress);
                            }
                        }}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-xs md:text-sm font-medium text-gray-700">Permanent address same as correspondence</span>
                </label>
            </div>

            {!formData.sameAsCorrespondence && (
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Permanent Address</label>
                    <textarea
                        value={formData.permanentAddress}
                        onChange={(e) => updateField('permanentAddress', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        rows={3}
                        placeholder="Enter permanent address"
                    />
                </div>
            )}
        </div>
    );
}

// Step 3: Education
function Step3Education({ formData, updateField }: any) {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <GraduationCap className="text-primary-600" size={28} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Education & Professional</h2>
                <p className="text-sm text-gray-500">Your academic background</p>
            </div>

            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Qualification</label>
                    <input
                        type="text"
                        value={formData.qualification}
                        onChange={(e) => updateField('qualification', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        placeholder="e.g., B.Sc Agriculture"
                    />
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Specialization</label>
                    <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => updateField('specialization', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        placeholder="e.g., Agronomy"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Institute Name</label>
                <input
                    type="text"
                    value={formData.instituteName}
                    onChange={(e) => updateField('instituteName', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    placeholder="Name of your college/institute"
                />
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">University Name</label>
                <input
                    type="text"
                    value={formData.universityName}
                    onChange={(e) => updateField('universityName', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    placeholder="Name of your university"
                />
            </div>
        </div>
    );
}

// Step 4: Farm Details
function Step4Farm({ formData, updateField }: any) {
    const commonCrops = ['Cotton', 'Soybean', 'Wheat', 'Rice', 'Sugarcane', 'Maize', 'Pulses', 'Vegetables'];

    const toggleCrop = (crop: string) => {
        const crops = formData.crops || [];
        if (crops.includes(crop)) {
            updateField('crops', crops.filter((c: string) => c !== crop));
        } else {
            updateField('crops', [...crops, crop]);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Sprout className="text-primary-600" size={28} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Farm Details</h2>
                <p className="text-sm text-gray-500">Tell us about your farm</p>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Farm Size (in Acres) *</label>
                <input
                    type="number"
                    value={formData.farmSize}
                    onChange={(e) => updateField('farmSize', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    placeholder="Enter farm size"
                    min="0"
                    step="0.5"
                />
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-3">Crops Grown (Select all that apply)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {commonCrops.map(crop => (
                        <button
                            key={crop}
                            type="button"
                            onClick={() => toggleCrop(crop)}
                            className={`px-3 md:px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${formData.crops?.includes(crop)
                                ? 'bg-primary-50 border-primary-500 text-primary-700'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
                                }`}
                        >
                            {crop}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Step 5: Business Information (Optional)
function Step5Business({ formData, updateField }: any) {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Building2 className="text-primary-600" size={28} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Business Information</h2>
                <p className="text-sm text-gray-500">Optional - only if you have a registered company</p>
            </div>

            <div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.hasCompany}
                        onChange={(e) => updateField('hasCompany', e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-xs md:text-sm font-medium text-gray-700">I have a registered company/firm</span>
                </label>
            </div>

            {formData.hasCompany && (
                <>
                    <div>
                        <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Company Name</label>
                        <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => updateField('companyName', e.target.value)}
                            className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                            placeholder="Enter company name"
                        />
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Company Type</label>
                        <select
                            value={formData.companyType || ''}
                            onChange={(e) => updateField('companyType', e.target.value || undefined)}
                            className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        >
                            <option value="">Select type</option>
                            <option value="Private Company">Private Company</option>
                            <option value="Registered Partnership Firm">Registered Partnership Firm</option>
                            <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Company CIN</label>
                        <input
                            type="text"
                            value={formData.companyCIN}
                            onChange={(e) => updateField('companyCIN', e.target.value)}
                            className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                            placeholder="Corporate Identification Number"
                        />
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Company Address</label>
                        <textarea
                            value={formData.companyAddress}
                            onChange={(e) => updateField('companyAddress', e.target.value)}
                            className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                            rows={3}
                            placeholder="Enter company registered address"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

// Step 6: Project / Innovation Details (Hackathon Specific)
function Step6Project({ formData, updateField }: any) {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Lightbulb className="text-primary-600" size={28} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Innovation Details</h2>
                <p className="text-sm text-gray-500">Tell us about your Hackathon Project</p>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Technology/Agri-Business Theme *</label>
                <select
                    value={formData.projectTheme || ''}
                    onChange={(e) => updateField('projectTheme', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                >
                    <option value="AI & IoT">Application of AI & IoT in Agriculture</option>
                    <option value="Farm Mechanization">Farm Mechanization</option>
                    <option value="Post Harvest">Post Harvest, Food Technology & Value Addition</option>
                    <option value="Waste to Wealth">Waste to Wealth & Green Energy</option>
                    <option value="Other">Other Agriculture Techniques</option>
                </select>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Name of Product/Service *</label>
                <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => updateField('productName', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    placeholder="e.g., Crop Doctor AI"
                />
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Concept of the Idea (Max 200 words) *</label>
                <textarea
                    value={formData.projectConcept}
                    onChange={(e) => updateField('projectConcept', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    rows={4}
                    placeholder="Describe your innovation..."
                />
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Uniqueness/Innovativeness *</label>
                <textarea
                    value={formData.innovationDescription}
                    onChange={(e) => updateField('innovationDescription', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    rows={3}
                    placeholder="What makes your solution unique?"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            checked={formData.hasPatent}
                            onChange={(e) => updateField('hasPatent', e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-xs md:text-sm font-medium text-gray-700">Do you have a Patent?</span>
                    </label>
                    {formData.hasPatent && (
                        <input
                            type="text"
                            value={formData.patentNumber}
                            onChange={(e) => updateField('patentNumber', e.target.value)}
                            className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                            placeholder="Patent Number"
                        />
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Primary Customer *</label>
                    <input
                        type="text"
                        value={formData.primaryCustomer}
                        onChange={(e) => updateField('primaryCustomer', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        placeholder="e.g., Small Farmers"
                    />
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Market Opportunity *</label>
                    <input
                        type="text"
                        value={formData.marketOpportunity}
                        onChange={(e) => updateField('marketOpportunity', e.target.value)}
                        className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                        placeholder="e.g., 50M Farmers in India"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Revenue Model (Max 100 words) *</label>
                <textarea
                    value={formData.revenueModel}
                    onChange={(e) => updateField('revenueModel', e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    rows={3}
                    placeholder="How will you make money?"
                />
            </div>
        </div>
    );
}
