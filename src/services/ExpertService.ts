export interface Expert {
    id: string;
    name: string;
    role: string;
    specialization: string;
    experience: string;
    language: string;
    rating: number;
    image: string;
    available: boolean;
    whatsappNumber: string;
}

export const EXPERTS: Expert[] = [
    {
        id: '1',
        name: 'Dr. Ramesh Patil',
        role: 'Senior Agronomist',
        specialization: 'Cotton & Soybean',
        experience: '15+ Years',
        language: 'Marathi, Hindi',
        rating: 4.9,
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        available: true,
        whatsappNumber: '919876543210'
    },
    {
        id: '2',
        name: 'Smt. Anjali Deshmukh',
        role: 'Pest Control Specialist',
        specialization: 'Organic Farming',
        experience: '8 Years',
        language: 'Marathi, English',
        rating: 4.7,
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
        available: true,
        whatsappNumber: '919876543211'
    },
    {
        id: '3',
        name: 'Mr. Suresh Jadhav',
        role: 'Soil Health Expert',
        specialization: 'Fertilizers & Irrigation',
        experience: '12 Years',
        language: 'Marathi',
        rating: 4.8,
        image: 'https://randomuser.me/api/portraits/men/85.jpg',
        available: false,
        whatsappNumber: '919876543212'
    }
];

export const getExperts = async (): Promise<Expert[]> => {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(EXPERTS);
        }, 500);
    });
};
