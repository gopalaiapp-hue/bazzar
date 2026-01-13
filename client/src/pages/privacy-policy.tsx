import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useBackButton } from "@/hooks/useBackButton";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
    const [, setLocation] = useLocation();
    const { t } = useTranslation();

    // Implement double-tap back button logic
    useBackButton(() => setLocation("/profile"));

    return (
        <MobileShell>
            <div className="pb-8">
                {/* Header */}
                <div className="bg-white p-6 border-b border-gray-100 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setLocation("/profile")} className="p-2 hover:bg-gray-100 rounded-full">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-heading font-bold">{t('privacyPolicy.title')}</h1>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{t('privacyPolicy.lastUpdated')}: Nov 29, 2025</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-w-2xl mx-auto">

                    {/* Introduction */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.introduction.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.introduction.content')}
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.dataCollection.heading')}</h2>
                        <div className="space-y-2 text-sm">
                            <p><strong>{t('privacyPolicy.dataCollection.personalInfo')}</strong> {t('privacyPolicy.dataCollection.personalInfoDesc')}</p>
                            <p><strong>{t('privacyPolicy.dataCollection.financialData')}</strong> {t('privacyPolicy.dataCollection.financialDataDesc')}</p>
                            <p><strong>{t('privacyPolicy.dataCollection.deviceInfo')}</strong> {t('privacyPolicy.dataCollection.deviceInfoDesc')}</p>
                            <p><strong>{t('privacyPolicy.dataCollection.usageData')}</strong> {t('privacyPolicy.dataCollection.usageDataDesc')}</p>
                            <p><strong>{t('privacyPolicy.dataCollection.photos')}</strong> {t('privacyPolicy.dataCollection.photosDesc')}</p>
                        </div>
                    </section>

                    {/* How We Use Information */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.dataUsage.heading')}</h2>
                        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                            <li>{t('privacyPolicy.dataUsage.feature1')}</li>
                            <li>{t('privacyPolicy.dataUsage.feature2')}</li>
                            <li>{t('privacyPolicy.dataUsage.feature3')}</li>
                            <li>{t('privacyPolicy.dataUsage.feature4')}</li>
                            <li>{t('privacyPolicy.dataUsage.feature5')}</li>
                            <li>{t('privacyPolicy.dataUsage.feature6')}</li>
                        </ul>
                    </section>

                    {/* Data Security */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.security.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.security.content')}
                        </p>
                    </section>

                    {/* Family Data Sharing */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.familySharing.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.familySharing.content')}
                        </p>
                    </section>

                    {/* Third-Party Services */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.thirdParty.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.thirdParty.intro')}
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                            <li>{t('privacyPolicy.thirdParty.payment')}</li>
                            <li>{t('privacyPolicy.thirdParty.storage')}</li>
                            <li>{t('privacyPolicy.thirdParty.analytics')}</li>
                            <li>{t('privacyPolicy.thirdParty.sms')}</li>
                        </ul>
                        <p className="text-sm text-gray-700 mt-2">{t('privacyPolicy.thirdParty.disclaimer')}</p>
                    </section>

                    {/* Your Rights */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.userRights.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.userRights.intro')}
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                            <li>{t('privacyPolicy.userRights.access')}</li>
                            <li>{t('privacyPolicy.userRights.correct')}</li>
                            <li>{t('privacyPolicy.userRights.delete')}</li>
                            <li>{t('privacyPolicy.userRights.export')}</li>
                            <li>{t('privacyPolicy.userRights.withdraw')}</li>
                        </ul>
                    </section>

                    {/* Data Retention */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.dataRetention.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.dataRetention.content')}
                        </p>
                    </section>

                    {/* GDPR & CCPA Compliance */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.compliance.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.compliance.intro')}
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                            <li><strong>{t('privacyPolicy.compliance.gdpr')}</strong> {t('privacyPolicy.compliance.gdprDesc')}</li>
                            <li><strong>{t('privacyPolicy.compliance.ccpa')}</strong> {t('privacyPolicy.compliance.ccpaDesc')}</li>
                            <li><strong>{t('privacyPolicy.compliance.india')}</strong></li>
                            <li><strong>{t('privacyPolicy.compliance.rbi')}</strong> {t('privacyPolicy.compliance.rbiDesc')}</li>
                        </ul>
                    </section>

                    {/* Children's Privacy */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.childrenPrivacy.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.childrenPrivacy.content')}
                        </p>
                    </section>

                    {/* Contact Us */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.contact.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.contact.intro')}
                        </p>
                        <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
                            <p><strong>{t('privacyPolicy.contact.email')}</strong> niteshjha.uiux@yahoo.com</p>
                            <p><strong>{t('privacyPolicy.contact.address')}</strong> {t('privacyPolicy.contact.addressValue')}</p>
                        </div>
                    </section>

                    {/* Policy Changes */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.changes.heading')}</h2>
                        <p className="text-sm text-gray-700">
                            {t('privacyPolicy.changes.content')}
                        </p>
                    </section>

                    {/* Download Links */}
                    <section className="space-y-4 mt-8 pt-8 border-t border-gray-200">
                        <h2 className="text-lg font-bold">{t('privacyPolicy.download.heading')}</h2>
                        <div className="space-y-3">
                            <a
                                href="https://play.google.com/store/apps/details?id=com.bazaarbudget.mobile"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <Button className="w-full bg-green-600 hover:bg-green-700">
                                    {t('privacyPolicy.download.playStore')}
                                </Button>
                            </a>

                            <a
                                href="https://apps.apple.com/app/bazaarbudget/id1234567890"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <Button className="w-full bg-black hover:bg-gray-800">
                                    {t('privacyPolicy.download.appStore')}
                                </Button>
                            </a>

                            <a
                                href="https://spray-scan-43088454.figma.site/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <Button variant="outline" className="w-full">
                                    {t('privacyPolicy.download.website')}
                                </Button>
                            </a>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-400 pt-8">
                        <p>{t('privacyPolicy.footer.copyright')}</p>
                        <p className="mt-1">{t('privacyPolicy.footer.tagline')}</p>
                    </div>
                </div>
            </div>
        </MobileShell>
    );
}
