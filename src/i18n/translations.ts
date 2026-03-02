/**
 * Crop Doctor — Translation Dictionary
 * Industry-grade Marathi translations based on usage in:
 * - Agrowon newspaper (Maharashtra's leading agri paper)
 * - ICAR-NRRI Maharashtra terminology
 * - Maharashtra government agricultural portals
 *
 * NOT Google Translate — every key is reviewed for natural usage.
 */

export type Locale = 'en' | 'mr';

export type TranslationKey =
    // ── Navigation ──
    | 'nav.home' | 'nav.diagnose' | 'nav.soil' | 'nav.experts'
    | 'nav.history' | 'nav.settings' | 'nav.more'
    | 'nav.aiAssistant'
    // ── Common ──
    | 'common.loading' | 'common.error' | 'common.retry' | 'common.close'
    | 'common.back' | 'common.next' | 'common.submit' | 'common.cancel'
    | 'common.save' | 'common.saving' | 'common.viewAll' | 'common.refresh'
    | 'common.noData' | 'common.search' | 'common.filter' | 'common.share'
    | 'common.download' | 'common.delete' | 'common.edit' | 'common.add'
    | 'common.yes' | 'common.no' | 'common.ok' | 'common.done'
    | 'common.acres' | 'common.years' | 'common.perQuintal'
    // ── Home Page ──
    | 'home.welcomeBack' | 'home.greeting' | 'home.greetingSuffix'
    | 'home.locating' | 'home.smartAdvisory' | 'home.liveAdvisory'
    | 'home.weatherUnavailable' | 'home.feelsLike'
    | 'home.wind' | 'home.humidity' | 'home.soilMoisture' | 'home.rain'
    | 'home.latestUpdates' | 'home.farmInsights' | 'home.yourCrops'
    | 'home.noNews' | 'home.noNewsHint'
    | 'home.nocrops' | 'home.nocropsHint'
    | 'home.scanNewCrop' | 'home.scanSubtitle'
    | 'home.upgradeBanner' | 'home.upgradeSub'
    | 'home.loadingInsights'
    // ── Diagnosis Page ──
    | 'diag.title' | 'diag.subtitle' | 'diag.uploadPhoto'
    | 'diag.takePhoto' | 'diag.analyzeBtn' | 'diag.analyzing'
    | 'diag.resultTitle' | 'diag.diseaseDetected' | 'diag.healthyCrop'
    | 'diag.noDiseaseFound' | 'diag.confidence'
    | 'diag.symptoms' | 'diag.causes' | 'diag.prevention'
    | 'diag.organicTreatment' | 'diag.chemicalTreatment'
    | 'diag.treatment' | 'diag.pesticide' | 'diag.dosage'
    | 'diag.askAI' | 'diag.downloadReport' | 'diag.shareReport'
    | 'diag.scanAgain' | 'diag.severity' | 'diag.low' | 'diag.medium' | 'diag.high'
    | 'diag.selectCrop' | 'diag.cropType' | 'diag.scanTip'
    // ── Soil Analyzer ──
    | 'soil.title' | 'soil.subtitle' | 'soil.analyzeBtn' | 'soil.analyzing'
    | 'soil.ph' | 'soil.nitrogen' | 'soil.phosphorus' | 'soil.potassium'
    | 'soil.organicCarbon' | 'soil.ec' | 'soil.moisture'
    | 'soil.aiRecommendation' | 'soil.fertilizerPlan' | 'soil.testType'
    | 'soil.resultTitle' | 'soil.noReport' | 'soil.downloadPDF'
    | 'soil.acreageLabel' | 'soil.shoppingList' | 'soil.bags'
    | 'soil.lowLabel' | 'soil.medLabel' | 'soil.highLabel' | 'soil.optLabel'
    // ── History Page ──
    | 'hist.title' | 'hist.subtitle' | 'hist.date' | 'hist.crop'
    | 'hist.disease' | 'hist.status' | 'hist.noRecords' | 'hist.noRecordsHint'
    | 'hist.deleteConfirm' | 'hist.deleteSuccess' | 'hist.filter.all'
    | 'hist.filter.high' | 'hist.filter.medium' | 'hist.filter.low'
    | 'hist.records'
    // ── Experts Page ──
    | 'exp.title' | 'exp.subtitle' | 'exp.bookCall' | 'exp.languages'
    | 'exp.experience' | 'exp.available' | 'exp.unavailable'
    | 'exp.specialization' | 'exp.bookSuccess' | 'exp.bookError'
    | 'exp.consultationsTitle'
    // ── Settings Page ──
    | 'set.title' | 'set.personalInfo' | 'set.farmDetails'
    | 'set.language' | 'set.languageHint'
    | 'set.firstName' | 'set.lastName' | 'set.phone' | 'set.email'
    | 'set.farmSize' | 'set.crops' | 'set.saveProfile'
    | 'set.cloudSync' | 'set.syncOn' | 'set.syncOff'
    | 'set.dangerZone' | 'set.logout' | 'set.deleteAccount'
    | 'set.notifications' | 'set.version'
    // ── Government Schemes ──
    | 'scheme.title' | 'scheme.subtitle' | 'scheme.eligible'
    | 'scheme.applyNow' | 'scheme.benefits' | 'scheme.criteria'
    | 'scheme.noSchemes' | 'scheme.matchCount'
    // ── Market Widget ──
    | 'mkt.title' | 'mkt.subtitle' | 'mkt.trend' | 'mkt.perQuintal'
    | 'mkt.today' | 'mkt.noData' | 'mkt.loading' | 'mkt.deepInsight'
    | 'mkt.close'
    // ── Notifications ──
    | 'notif.title' | 'notif.empty' | 'notif.markAllRead'
    // ── PageHeader subtitles ──
    | 'ph.home' | 'ph.diagnose' | 'ph.soil' | 'ph.experts'
    | 'ph.history' | 'ph.settings' | 'ph.schemes';

type Translations = Record<TranslationKey, string>;

const en: Translations = {
    // Navigation
    'nav.home': 'Home',
    'nav.diagnose': 'Diagnose',
    'nav.soil': 'Soil',
    'nav.experts': 'Experts',
    'nav.history': 'History',
    'nav.settings': 'Settings',
    'nav.more': 'More',
    'nav.aiAssistant': 'AI Assistant',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.saving': 'Saving...',
    'common.viewAll': 'View All',
    'common.refresh': 'Refresh',
    'common.noData': 'No data available',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.share': 'Share',
    'common.download': 'Download',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.done': 'Done',
    'common.acres': 'Acres',
    'common.years': 'years',
    'common.perQuintal': 'per quintal',

    // Home
    'home.welcomeBack': 'Welcome Back',
    'home.greeting': 'Hello',
    'home.greetingSuffix': '! 👋',
    'home.locating': 'Locating...',
    'home.smartAdvisory': 'Smart Advisory',
    'home.liveAdvisory': 'Live Smart Advisory',
    'home.weatherUnavailable': 'Weather unavailable',
    'home.feelsLike': 'Feels like',
    'home.wind': 'Wind',
    'home.humidity': 'Humidity',
    'home.soilMoisture': 'Soil',
    'home.rain': 'Rain',
    'home.latestUpdates': 'Latest Local Updates',
    'home.farmInsights': 'Farm Insights',
    'home.yourCrops': 'Your Crops',
    'home.noNews': 'No recent updates found.',
    'home.noNewsHint': 'Please check your internet connection.',
    'home.nocrops': 'No crops scanned yet',
    'home.nocropsHint': 'Run your first diagnosis below',
    'home.scanNewCrop': 'Scan New Crop',
    'home.scanSubtitle': 'AI-powered disease detection',
    'home.upgradeBanner': 'Upgrade to Crop Doctor Pro',
    'home.upgradeSub': 'Unlimited consultations & verified reports.',
    'home.loadingInsights': 'Loading insights...',

    // Diagnosis
    'diag.title': 'Crop Diagnosis',
    'diag.subtitle': 'AI-Powered Disease Detection',
    'diag.uploadPhoto': 'Upload Photo',
    'diag.takePhoto': 'Take Photo',
    'diag.analyzeBtn': 'Analyze Crop',
    'diag.analyzing': 'Analyzing...',
    'diag.resultTitle': 'Diagnosis Result',
    'diag.diseaseDetected': 'Disease Detected',
    'diag.healthyCrop': 'Healthy Crop',
    'diag.noDiseaseFound': 'No disease found',
    'diag.confidence': 'Confidence',
    'diag.symptoms': 'Symptoms',
    'diag.causes': 'Causes',
    'diag.prevention': 'Prevention',
    'diag.organicTreatment': 'Organic Treatment',
    'diag.chemicalTreatment': 'Chemical Treatment',
    'diag.treatment': 'Treatment',
    'diag.pesticide': 'Pesticide',
    'diag.dosage': 'Dosage',
    'diag.askAI': 'Ask AI',
    'diag.downloadReport': 'Download Report',
    'diag.shareReport': 'Share Report',
    'diag.scanAgain': 'Scan Again',
    'diag.severity': 'Severity',
    'diag.low': 'Low',
    'diag.medium': 'Medium',
    'diag.high': 'High',
    'diag.selectCrop': 'Select Crop',
    'diag.cropType': 'Crop Type',
    'diag.scanTip': 'Hold camera steady, ensure good lighting',

    // Soil
    'soil.title': 'Soil Analyzer',
    'soil.subtitle': 'AI Soil Health Report',
    'soil.analyzeBtn': 'Analyze Soil',
    'soil.analyzing': 'Analyzing...',
    'soil.ph': 'Soil pH',
    'soil.nitrogen': 'Nitrogen (N)',
    'soil.phosphorus': 'Phosphorus (P)',
    'soil.potassium': 'Potassium (K)',
    'soil.organicCarbon': 'Organic Carbon',
    'soil.ec': 'Electrical Conductivity',
    'soil.moisture': 'Moisture',
    'soil.aiRecommendation': 'AI Recommendation',
    'soil.fertilizerPlan': 'Fertilizer Plan',
    'soil.testType': 'Test Type',
    'soil.resultTitle': 'Soil Report',
    'soil.noReport': 'No soil report yet',
    'soil.downloadPDF': 'Download PDF Report',
    'soil.acreageLabel': 'Farm Area (acres)',
    'soil.shoppingList': 'Fertilizer Shopping List',
    'soil.bags': 'bags',
    'soil.lowLabel': 'Low',
    'soil.medLabel': 'Medium',
    'soil.highLabel': 'High',
    'soil.optLabel': 'Optimal',

    // History
    'hist.title': 'Crop History',
    'hist.subtitle': 'All Past Diagnoses',
    'hist.date': 'Date',
    'hist.crop': 'Crop',
    'hist.disease': 'Disease',
    'hist.status': 'Status',
    'hist.noRecords': 'No records found',
    'hist.noRecordsHint': 'Run a diagnosis to see your history here.',
    'hist.deleteConfirm': 'Are you sure you want to delete this record?',
    'hist.deleteSuccess': 'Record deleted successfully',
    'hist.filter.all': 'All',
    'hist.filter.high': 'High',
    'hist.filter.medium': 'Medium',
    'hist.filter.low': 'Low',
    'hist.records': 'records',

    // Experts
    'exp.title': 'Crop Experts',
    'exp.subtitle': 'Verified Agronomists',
    'exp.bookCall': 'Book Call',
    'exp.languages': 'Languages',
    'exp.experience': 'Experience',
    'exp.available': 'Available',
    'exp.unavailable': 'Unavailable',
    'exp.specialization': 'Specialization',
    'exp.bookSuccess': 'Consultation booked successfully!',
    'exp.bookError': 'Booking failed. Please try again.',
    'exp.consultationsTitle': 'My Consultations',

    // Settings
    'set.title': 'Settings',
    'set.personalInfo': 'Personal Information',
    'set.farmDetails': 'Farm Details',
    'set.language': 'Application Language',
    'set.languageHint': 'Choose your preferred language',
    'set.firstName': 'First Name',
    'set.lastName': 'Last Name',
    'set.phone': 'Phone',
    'set.email': 'Email',
    'set.farmSize': 'Farm Size (acres)',
    'set.crops': 'Crops Grown',
    'set.saveProfile': 'Save Profile',
    'set.cloudSync': 'Cloud Sync',
    'set.syncOn': 'Cloud sync is active',
    'set.syncOff': 'Cloud sync is not configured',
    'set.dangerZone': 'Account',
    'set.logout': 'Log Out',
    'set.deleteAccount': 'Delete Account',
    'set.notifications': 'Notifications',
    'set.version': 'App Version',

    // Schemes
    'scheme.title': 'Government Schemes',
    'scheme.subtitle': 'Schemes you may be eligible for',
    'scheme.eligible': 'Eligible',
    'scheme.applyNow': 'Apply Now',
    'scheme.benefits': 'Benefits',
    'scheme.criteria': 'Eligibility Criteria',
    'scheme.noSchemes': 'No matching schemes found',
    'scheme.matchCount': 'matching schemes',

    // Market
    'mkt.title': 'Mandi Rates',
    'mkt.subtitle': "Today's Market Prices",
    'mkt.trend': 'Price Trend',
    'mkt.perQuintal': '/ qtl',
    'mkt.today': 'Today',
    'mkt.noData': 'Market data unavailable',
    'mkt.loading': 'Fetching prices...',
    'mkt.deepInsight': 'Deep Insight',
    'mkt.close': 'Close Detail',

    // Notifications
    'notif.title': 'Notifications',
    'notif.empty': 'All caught up!',
    'notif.markAllRead': 'Mark all as read',

    // PageHeader subtitles
    'ph.home': 'Smart Farm Dashboard',
    'ph.diagnose': 'AI-Powered Disease Detection',
    'ph.soil': 'AI Soil Health Report',
    'ph.experts': 'Verified Agronomists',
    'ph.history': 'All Past Diagnoses',
    'ph.settings': 'Profile & Preferences',
    'ph.schemes': 'Govt. Schemes & Benefits',
};

const mr: Translations = {
    // Navigation — as used in Maharashtra agri apps & Agrowon
    'nav.home': 'मुख्यपृष्ठ',
    'nav.diagnose': 'रोग निदान',
    'nav.soil': 'माती परीक्षण',
    'nav.experts': 'तज्ज्ञ',
    'nav.history': 'इतिहास',
    'nav.settings': 'सेटिंग्ज',
    'nav.more': 'अधिक',
    'nav.aiAssistant': 'AI सहाय्यक',

    // Common
    'common.loading': 'लोड होत आहे...',
    'common.error': 'त्रुटी',
    'common.retry': 'पुन्हा प्रयत्न करा',
    'common.close': 'बंद करा',
    'common.back': 'मागे',
    'common.next': 'पुढे',
    'common.submit': 'सबमिट करा',
    'common.cancel': 'रद्द करा',
    'common.save': 'जतन करा',
    'common.saving': 'जतन होत आहे...',
    'common.viewAll': 'सर्व पहा',
    'common.refresh': 'ताजे करा',
    'common.noData': 'माहिती उपलब्ध नाही',
    'common.search': 'शोधा',
    'common.filter': 'गाळण',
    'common.share': 'शेअर करा',
    'common.download': 'डाउनलोड करा',
    'common.delete': 'हटवा',
    'common.edit': 'बदला',
    'common.add': 'जोडा',
    'common.yes': 'होय',
    'common.no': 'नाही',
    'common.ok': 'ठीक आहे',
    'common.done': 'पूर्ण झाले',
    'common.acres': 'एकर',
    'common.years': 'वर्षे',
    'common.perQuintal': 'प्रति क्विंटल',

    // Home — natural Marathi as used in field
    'home.welcomeBack': 'स्वागत आहे',
    'home.greeting': 'नमस्कार',
    'home.greetingSuffix': '! 🙏',
    'home.locating': 'स्थान शोधत आहे...',
    'home.smartAdvisory': 'स्मार्ट सल्ला',
    'home.liveAdvisory': 'थेट कृषी सल्ला',
    'home.weatherUnavailable': 'हवामान उपलब्ध नाही',
    'home.feelsLike': 'जाणवते',
    'home.wind': 'वारा',
    'home.humidity': 'आर्द्रता',
    'home.soilMoisture': 'ओलावा',
    'home.rain': 'पाऊस',
    'home.latestUpdates': 'ताज्या स्थानिक बातम्या',
    'home.farmInsights': 'शेत माहिती',
    'home.yourCrops': 'तुमची पिके',
    'home.noNews': 'कोणत्याही नवीन बातम्या सापडल्या नाहीत.',
    'home.noNewsHint': 'कृपया इंटरनेट कनेक्शन तपासा.',
    'home.nocrops': 'अद्याप कोणतेही पीक स्कॅन केले नाही',
    'home.nocropsHint': 'खाली पहिले निदान करा',
    'home.scanNewCrop': 'नवीन पीक स्कॅन करा',
    'home.scanSubtitle': 'AI-आधारित रोग ओळख',
    'home.upgradeBanner': 'क्रॉप डॉक्टर प्रो वर अपग्रेड करा',
    'home.upgradeSub': 'अमर्यादित सल्लामसलत आणि सत्यापित अहवाल.',
    'home.loadingInsights': 'माहिती लोड होत आहे...',

    // Diagnosis — ICAR / KVK standard Marathi terminology
    'diag.title': 'पीक रोग निदान',
    'diag.subtitle': 'AI-आधारित रोग ओळख प्रणाली',
    'diag.uploadPhoto': 'फोटो अपलोड करा',
    'diag.takePhoto': 'फोटो काढा',
    'diag.analyzeBtn': 'पीक तपासा',
    'diag.analyzing': 'तपासणी सुरू आहे...',
    'diag.resultTitle': 'निदान निकाल',
    'diag.diseaseDetected': 'रोग आढळला',
    'diag.healthyCrop': 'पीक निरोगी आहे',
    'diag.noDiseaseFound': 'कोणताही रोग आढळला नाही',
    'diag.confidence': 'निश्चितता',
    'diag.symptoms': 'लक्षणे',
    'diag.causes': 'कारणे',
    'diag.prevention': 'प्रतिबंध',
    'diag.organicTreatment': 'सेंद्रिय उपाय',
    'diag.chemicalTreatment': 'रासायनिक उपाय',
    'diag.treatment': 'उपचार',
    'diag.pesticide': 'कीटकनाशक',
    'diag.dosage': 'मात्रा',
    'diag.askAI': 'AI ला विचारा',
    'diag.downloadReport': 'अहवाल डाउनलोड करा',
    'diag.shareReport': 'अहवाल शेअर करा',
    'diag.scanAgain': 'पुन्हा स्कॅन करा',
    'diag.severity': 'तीव्रता',
    'diag.low': 'कमी',
    'diag.medium': 'मध्यम',
    'diag.high': 'जास्त',
    'diag.selectCrop': 'पीक निवडा',
    'diag.cropType': 'पिकाचा प्रकार',
    'diag.scanTip': 'कॅमेरा स्थिर ठेवा, चांगला प्रकाश असल्याची खात्री करा',

    // Soil — Maharashtra Soil Testing Lab standard terms
    'soil.title': 'माती परीक्षण',
    'soil.subtitle': 'AI माती आरोग्य अहवाल',
    'soil.analyzeBtn': 'माती तपासा',
    'soil.analyzing': 'विश्लेषण सुरू आहे...',
    'soil.ph': 'मातीचा pH',
    'soil.nitrogen': 'नायट्रोजन (N)',
    'soil.phosphorus': 'स्फुरद (P)',
    'soil.potassium': 'पालाश (K)',
    'soil.organicCarbon': 'सेंद्रिय कर्ब',
    'soil.ec': 'विद्युत चालकता',
    'soil.moisture': 'ओलावा',
    'soil.aiRecommendation': 'AI शिफारस',
    'soil.fertilizerPlan': 'खत योजना',
    'soil.testType': 'चाचणी प्रकार',
    'soil.resultTitle': 'माती अहवाल',
    'soil.noReport': 'माती अहवाल उपलब्ध नाही',
    'soil.downloadPDF': 'PDF अहवाल डाउनलोड करा',
    'soil.acreageLabel': 'शेती क्षेत्र (एकर)',
    'soil.shoppingList': 'खत खरेदी यादी',
    'soil.bags': 'पोती',
    'soil.lowLabel': 'कमी',
    'soil.medLabel': 'मध्यम',
    'soil.highLabel': 'जास्त',
    'soil.optLabel': 'योग्य',

    // History
    'hist.title': 'पीक इतिहास',
    'hist.subtitle': 'सर्व मागील निदान',
    'hist.date': 'तारीख',
    'hist.crop': 'पीक',
    'hist.disease': 'रोग',
    'hist.status': 'स्थिती',
    'hist.noRecords': 'कोणताही रेकॉर्ड आढळला नाही',
    'hist.noRecordsHint': 'इतिहास पाहण्यासाठी निदान करा.',
    'hist.deleteConfirm': 'हा रेकॉर्ड हटवायचा आहे का?',
    'hist.deleteSuccess': 'रेकॉर्ड यशस्वीरित्या हटवला',
    'hist.filter.all': 'सर्व',
    'hist.filter.high': 'जास्त',
    'hist.filter.medium': 'मध्यम',
    'hist.filter.low': 'कमी',
    'hist.records': 'नोंदी',

    // Experts — KVK / Agrowon terminology
    'exp.title': 'कृषी तज्ज्ञ',
    'exp.subtitle': 'प्रमाणित कृषी सल्लागार',
    'exp.bookCall': 'कॉल बुक करा',
    'exp.languages': 'भाषा',
    'exp.experience': 'अनुभव',
    'exp.available': 'उपलब्ध',
    'exp.unavailable': 'अनुपलब्ध',
    'exp.specialization': 'विशेषज्ञता',
    'exp.bookSuccess': 'सल्लामसलत यशस्वीरित्या बुक झाली!',
    'exp.bookError': 'बुकिंग अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
    'exp.consultationsTitle': 'माझ्या सल्लामसलती',

    // Settings
    'set.title': 'सेटिंग्ज',
    'set.personalInfo': 'वैयक्तिक माहिती',
    'set.farmDetails': 'शेत तपशील',
    'set.language': 'अनुप्रयोग भाषा',
    'set.languageHint': 'तुमची पसंतीची भाषा निवडा',
    'set.firstName': 'पहिले नाव',
    'set.lastName': 'आडनाव',
    'set.phone': 'मोबाईल',
    'set.email': 'ईमेल',
    'set.farmSize': 'शेत क्षेत्र (एकर)',
    'set.crops': 'घेतलेली पिके',
    'set.saveProfile': 'प्रोफाइल जतन करा',
    'set.cloudSync': 'क्लाउड सिंक',
    'set.syncOn': 'क्लाउड सिंक सुरू आहे',
    'set.syncOff': 'क्लाउड सिंक सेट केलेले नाही',
    'set.dangerZone': 'खाते',
    'set.logout': 'बाहेर पडा',
    'set.deleteAccount': 'खाते हटवा',
    'set.notifications': 'सूचना',
    'set.version': 'अॅप आवृत्ती',

    // Schemes — Maharashtra govt portal terminology
    'scheme.title': 'शासकीय योजना',
    'scheme.subtitle': 'तुम्ही पात्र असलेल्या योजना',
    'scheme.eligible': 'पात्र',
    'scheme.applyNow': 'आता अर्ज करा',
    'scheme.benefits': 'फायदे',
    'scheme.criteria': 'पात्रता निकष',
    'scheme.noSchemes': 'कोणत्याही योजना सापडल्या नाहीत',
    'scheme.matchCount': 'योजना जुळल्या',

    // Market — Mandi terminology used in Vidarbha
    'mkt.title': 'मंडई भाव',
    'mkt.subtitle': 'आजचे बाजार भाव',
    'mkt.trend': 'किंमत कल',
    'mkt.perQuintal': '/ क्विं.',
    'mkt.today': 'आज',
    'mkt.noData': 'बाजार माहिती उपलब्ध नाही',
    'mkt.loading': 'भाव लोड होत आहे...',
    'mkt.deepInsight': 'सखोल माहिती',
    'mkt.close': 'तपशील बंद करा',

    // Notifications
    'notif.title': 'सूचना',
    'notif.empty': 'सर्व वाचल्या गेल्या!',
    'notif.markAllRead': 'सर्व वाचल्या म्हणून चिन्हांकित करा',

    // PageHeader subtitles
    'ph.home': 'स्मार्ट शेती डॅशबोर्ड',
    'ph.diagnose': 'AI-आधारित रोग ओळख',
    'ph.soil': 'AI माती आरोग्य अहवाल',
    'ph.experts': 'प्रमाणित कृषी सल्लागार',
    'ph.history': 'सर्व मागील निदान',
    'ph.settings': 'प्रोफाइल आणि प्राधान्ये',
    'ph.schemes': 'शासकीय योजना आणि लाभ',
};

export const translations: Record<Locale, Translations> = { en, mr };
