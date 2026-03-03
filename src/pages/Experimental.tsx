import { Beaker, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useT } from '../i18n/useT';
import ARFieldViewWidget from '../components/ARFieldViewWidget';
import SmartFarmWidget from '../components/SmartFarmWidget';
import { motion, type Variants } from 'framer-motion';

const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } as any,
};

const item: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } as any,
};

export default function Experimental() {
    const { t } = useT();

    return (
        <div className="min-h-screen bg-surface pb-24 md:pb-10 font-sans">
            <PageHeader
                icon={<Beaker size={20} />}
                title={t('experimental.title') || "Experimental Features"}
                subtitle={t('nav.experimental') || "Beta Tools"}
            />

            <motion.div
                variants={container}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8"
            >
                {/* Beta Warning Banner */}
                <motion.section
                    variants={item}
                    className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-[2px] border-amber-400/30 rounded-[2rem] p-6 shadow-sm overflow-hidden relative"
                >
                    <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-amber-400/20 rounded-full blur-[30px] pointer-events-none" />

                    <div className="relative z-10 flex items-start sm:items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200 shadow-inner">
                            <AlertTriangle size={24} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-amber-900 leading-tight">Beta Features</h2>
                            <p className="text-sm font-bold text-amber-800/70 mt-1 max-w-2xl">
                                Welcome to the lab! These experimental tools utilize bleeding-edge hardware APIs and IoT integrations. They are provided as-is to demonstrate technical capacity and might not be fully stable.
                            </p>
                        </div>
                    </div>
                </motion.section>

                <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    {/* AR Field View Simulator */}
                    <div className="w-full h-full">
                        <ARFieldViewWidget />
                    </div>

                    {/* Smart Farm IoT Dashboard */}
                    <div className="w-full h-full">
                        <SmartFarmWidget />
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}
