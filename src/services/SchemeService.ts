
export interface GovernmentScheme {
    id: string;
    title: string;
    description: string;
    targetAudience: string;
    benefits: string;
    minLandSize?: number; // In Acres
    maxLandSize?: number; // In Acres
    states?: string[]; // Specific states, empty means all India
    url: string;
    category: 'financial' | 'insurance' | 'inputs' | 'tech';
    requiredGender?: 'Male' | 'Female' | 'Other';
    requiredCategory?: ('General' | 'OBC' | 'SC' | 'ST')[];
    isBPLRequired?: boolean;
    coveredCrops?: string[];
}

export const GOVT_SCHEMES: GovernmentScheme[] = [
    {
        id: 'pm-kisan',
        title: 'PM-Kisan Samman Nidhi',
        description: 'Direct income support of ₹6,000 per year to all landholding farmer families.',
        targetAudience: 'Small and Marginal Farmers',
        benefits: '₹2,000 every 4 months directly into bank account.',
        maxLandSize: 5,
        url: 'https://pmkisan.gov.in/',
        category: 'financial',
        isBPLRequired: false
    },
    {
        id: 'pm-fasal-bima',
        title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        description: 'Comprehensive crop insurance against natural calamities and pests.',
        targetAudience: 'All farmers including tenants',
        benefits: 'Low premium rates (1.5% - 5%) and faster claim settlement.',
        url: 'https://pmfby.gov.in/',
        category: 'insurance'
    },
    {
        id: 'pm-kusum',
        title: 'PM-KUSUM Scheme',
        description: 'Subsidies for solar water pumps and grid-connected solar power plants.',
        targetAudience: 'Individual farmers and cooperatives',
        benefits: 'Up to 60% subsidy on solar pump installation.',
        url: 'https://mnre.gov.in/pm-kusum/',
        category: 'tech'
    },
    {
        id: 'pmksy-per-drop',
        title: 'PMKSY - Per Drop More Crop',
        description: 'Financial assistance for micro-irrigation systems (Drip/Sprinkler).',
        targetAudience: 'All farmers',
        benefits: 'Up to 55% subsidy for small/marginal farmers.',
        url: 'https://pmksy.gov.in/',
        category: 'tech'
    },
    {
        id: 'pkvy-organic',
        title: 'Paramparagat Krishi Vikas Yojana (PKVY)',
        description: 'Promotion of commercial organic farming via cluster approach.',
        targetAudience: 'Farmer groups / clusters',
        benefits: '₹50,000 per hectare for 3 years for organic conversion.',
        url: 'https://daskms.dac.gov.in/',
        category: 'financial'
    },
    {
        id: 'enam',
        title: 'e-NAM (National Agriculture Market)',
        description: 'Online trading platform for agricultural commodities.',
        targetAudience: 'Farmers and FPOs',
        benefits: 'Better price discovery and direct access to more buyers.',
        url: 'https://enam.gov.in/',
        category: 'tech'
    },
    {
        id: 'pocra-maharashtra',
        title: 'PoCRA - Nanaji Deshmukh Sanjivani',
        description: 'Climate resilient agriculture project for Maharashtra drought-prone areas.',
        targetAudience: 'Farmers in Marathwada and Vidarbha',
        benefits: 'Subsidies for farm ponds, sheds, and community wells.',
        states: ['Maharashtra'],
        url: 'https://pocragov.in/',
        category: 'financial'
    },
    {
        id: 'shet-tale',
        title: 'Magel Tyala Shet Tale',
        description: 'Individual farm pond scheme for irrigation security in Maharashtra.',
        targetAudience: 'Small landholders',
        benefits: 'Up to ₹50,000 subsidy for digging farm ponds.',
        states: ['Maharashtra'],
        maxLandSize: 10,
        url: 'https://krishi.maharashtra.gov.in/',
        category: 'financial'
    },
    {
        id: 'acabc',
        title: 'Agri-Clinic & Agri-Business Centres',
        description: 'Loans for agricultural graduates to start agri-startups.',
        targetAudience: 'Unemployed agri graduates',
        benefits: '25% - 36% composite subsidy on bank loans.',
        url: 'https://www.manage.gov.in/',
        category: 'financial'
    },
    {
        id: 'mahila-kisan',
        title: 'Mahila Kisan Sashaktikaran Pariyojana (MKSP)',
        description: 'Empowering women in agriculture by making them systematic producers.',
        targetAudience: 'Women farmers',
        benefits: 'Training, knowledge sharing, and financial support for women clusters.',
        url: 'https://aajeevika.gov.in/mksp',
        category: 'financial',
        requiredGender: 'Female'
    },
    {
        id: 'sc-st-tractor-subsidy',
        title: 'Special Tractor Subsidy (Maharashtra)',
        description: 'High subsidy on tractors and farm machinery for SC/ST farmers.',
        targetAudience: 'SC and ST farmers in Maharashtra',
        benefits: 'Up to 50% subsidy (max ₹2.5 Lakh) on tractor purchase.',
        states: ['Maharashtra'],
        url: 'https://mahadbt.maharashtra.gov.in/',
        category: 'tech',
        requiredCategory: ['SC', 'ST']
    }
];

export const checkSchemeEligibility = (profile: any) => {
    const farmSize = parseFloat(profile.farmSize) || 0;
    const userState = (profile.locationName || profile.permanentAddress || '').toLowerCase();
    const userGender = profile.gender;
    const userCategory = profile.category;
    const userCrops = profile.crops || [];

    return GOVT_SCHEMES.map(scheme => {
        const checks = {
            landSize: true,
            state: true,
            gender: true,
            category: true,
            bpl: true,
            crops: true
        };

        // 1. Check Land Size
        if (scheme.minLandSize !== undefined && farmSize < scheme.minLandSize) checks.landSize = false;
        if (scheme.maxLandSize !== undefined && farmSize > scheme.maxLandSize) checks.landSize = false;

        // 2. Check State
        if (scheme.states && scheme.states.length > 0) {
            checks.state = scheme.states.some(s => userState.includes(s.toLowerCase()));
        }

        // 3. Check Gender
        if (scheme.requiredGender && userGender && userGender !== scheme.requiredGender) {
            checks.gender = false;
        }

        // 4. Check Category
        if (scheme.requiredCategory && scheme.requiredCategory.length > 0) {
            checks.category = scheme.requiredCategory.includes(userCategory);
        }

        // 5. Check BPL
        if (scheme.isBPLRequired && !profile.isBPL) {
            checks.bpl = false;
        }

        // 6. Check Crops
        if (scheme.coveredCrops && scheme.coveredCrops.length > 0) {
            checks.crops = scheme.coveredCrops.some(c => userCrops.includes(c));
        }

        const isEligible = Object.values(checks).every(v => v === true);
        const matchScore = (Object.values(checks).filter(v => v === true).length / Object.values(checks).length) * 100;

        return {
            ...scheme,
            isEligible,
            matchScore,
            mismatches: Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k)
        };
    });
};
