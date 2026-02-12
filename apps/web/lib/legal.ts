/**
 * Mino Legal Content — Terms of Service, Cookie Policy, Privacy Policy.
 *
 * All legal content is stored here as structured data for each locale.
 * These are rendered by the /terms, /cookies, and /privacy pages.
 */

import type { Locale } from "@/lib/i18n";

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

// ---------------------------------------------------------------------------
// Terms of Service
// ---------------------------------------------------------------------------

const termsEn: LegalDocument = {
  title: "Terms of Service",
  lastUpdated: "2026-02-12",
  sections: [
    {
      heading: "1. Acceptance of Terms",
      body: "By accessing or using Mino (the \"Service\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. Mino is open-source software, and these terms apply to the hosted version at mino.ink.",
    },
    {
      heading: "2. Description of Service",
      body: "Mino is an agent-first, markdown-based knowledge platform. The Service allows users to create, organize, and manage notes stored as markdown files on self-hosted or managed servers. Mino does not store your notes on its own infrastructure unless you opt into the free managed tier.",
    },
    {
      heading: "3. User Responsibilities",
      body: "You are responsible for maintaining the security of your API keys and server credentials. You agree not to use the Service for any unlawful purpose or in violation of any applicable laws. You are solely responsible for the content you create, store, or share through the Service.",
    },
    {
      heading: "4. Data Ownership",
      body: "Your notes and data remain your property at all times. Mino's architecture ensures that data is stored on servers you control. The mino.ink web client is a thin shell that connects to your server — it does not store or process your note content.",
    },
    {
      heading: "5. Open Source License",
      body: "Mino's source code is available under an open-source license. You are free to self-host, modify, and distribute the software in accordance with the license terms found in the GitHub repository.",
    },
    {
      heading: "6. Limitation of Liability",
      body: "The Service is provided \"as is\" without warranties of any kind. In no event shall the Mino team be liable for any indirect, incidental, special, or consequential damages arising from the use of the Service.",
    },
    {
      heading: "7. Changes to Terms",
      body: "We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated date. Continued use of the Service after changes constitutes acceptance of the new terms.",
    },
    {
      heading: "8. Contact",
      body: "For questions about these terms, please open an issue on our GitHub repository or contact us at legal@mino.ink.",
    },
  ],
};

const termsEs: LegalDocument = {
  title: "Términos de Servicio",
  lastUpdated: "2026-02-12",
  sections: [
    {
      heading: "1. Aceptación de los Términos",
      body: "Al acceder o utilizar Mino (el \"Servicio\"), aceptas estar vinculado por estos Términos de Servicio. Si no estás de acuerdo con estos términos, por favor no utilices el Servicio. Mino es software de código abierto, y estos términos se aplican a la versión alojada en mino.ink.",
    },
    {
      heading: "2. Descripción del Servicio",
      body: "Mino es una plataforma de conocimiento basada en markdown y orientada a agentes. El Servicio permite a los usuarios crear, organizar y gestionar notas almacenadas como archivos markdown en servidores autogestionados o administrados. Mino no almacena tus notas en su propia infraestructura a menos que optes por el nivel gratuito administrado.",
    },
    {
      heading: "3. Responsabilidades del Usuario",
      body: "Eres responsable de mantener la seguridad de tus claves API y credenciales del servidor. Aceptas no utilizar el Servicio para ningún propósito ilegal o en violación de cualquier ley aplicable. Eres el único responsable del contenido que creas, almacenas o compartes a través del Servicio.",
    },
    {
      heading: "4. Propiedad de los Datos",
      body: "Tus notas y datos siguen siendo de tu propiedad en todo momento. La arquitectura de Mino asegura que los datos se almacenen en servidores que tú controlas. El cliente web mino.ink es una capa ligera que se conecta a tu servidor — no almacena ni procesa el contenido de tus notas.",
    },
    {
      heading: "5. Licencia de Código Abierto",
      body: "El código fuente de Mino está disponible bajo una licencia de código abierto. Eres libre de autoalojar, modificar y distribuir el software de acuerdo con los términos de licencia encontrados en el repositorio de GitHub.",
    },
    {
      heading: "6. Limitación de Responsabilidad",
      body: "El Servicio se proporciona \"tal cual\" sin garantías de ningún tipo. En ningún caso el equipo de Mino será responsable de daños indirectos, incidentales, especiales o consecuentes derivados del uso del Servicio.",
    },
    {
      heading: "7. Cambios en los Términos",
      body: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios se publicarán en esta página con una fecha actualizada. El uso continuado del Servicio después de los cambios constituye la aceptación de los nuevos términos.",
    },
    {
      heading: "8. Contacto",
      body: "Para preguntas sobre estos términos, por favor abre un issue en nuestro repositorio de GitHub o contáctanos en legal@mino.ink.",
    },
  ],
};

const termsDe: LegalDocument = {
  title: "Nutzungsbedingungen",
  lastUpdated: "2026-02-12",
  sections: [
    {
      heading: "1. Annahme der Bedingungen",
      body: "Durch den Zugriff auf oder die Nutzung von Mino (dem \"Dienst\") erklärst du dich mit diesen Nutzungsbedingungen einverstanden. Wenn du diesen Bedingungen nicht zustimmst, nutze den Dienst bitte nicht. Mino ist Open-Source-Software, und diese Bedingungen gelten für die gehostete Version auf mino.ink.",
    },
    {
      heading: "2. Beschreibung des Dienstes",
      body: "Mino ist eine agenten-native, markdown-basierte Wissensplattform. Der Dienst ermöglicht es Nutzern, Notizen zu erstellen, zu organisieren und zu verwalten, die als Markdown-Dateien auf selbst gehosteten oder verwalteten Servern gespeichert werden. Mino speichert deine Notizen nicht auf seiner eigenen Infrastruktur, es sei denn, du entscheidest dich für die kostenlose verwaltete Stufe.",
    },
    {
      heading: "3. Verantwortlichkeiten des Nutzers",
      body: "Du bist verantwortlich für die Sicherheit deiner API-Schlüssel und Server-Zugangsdaten. Du stimmst zu, den Dienst nicht für rechtswidrige Zwecke oder unter Verstoß gegen geltende Gesetze zu nutzen. Du bist allein verantwortlich für die Inhalte, die du über den Dienst erstellst, speicherst oder teilst.",
    },
    {
      heading: "4. Dateneigentum",
      body: "Deine Notizen und Daten bleiben jederzeit dein Eigentum. Die Architektur von Mino stellt sicher, dass Daten auf Servern gespeichert werden, die du kontrollierst. Der mino.ink Web-Client ist eine dünne Schicht, die sich mit deinem Server verbindet — er speichert oder verarbeitet den Inhalt deiner Notizen nicht.",
    },
    {
      heading: "5. Open-Source-Lizenz",
      body: "Der Quellcode von Mino ist unter einer Open-Source-Lizenz verfügbar. Du darfst die Software gemäß den Lizenzbedingungen im GitHub-Repository selbst hosten, modifizieren und verteilen.",
    },
    {
      heading: "6. Haftungsbeschränkung",
      body: "Der Dienst wird \"wie besehen\" ohne Garantien jeglicher Art bereitgestellt. In keinem Fall haftet das Mino-Team für indirekte, zufällige, besondere oder Folgeschäden, die aus der Nutzung des Dienstes entstehen.",
    },
    {
      heading: "7. Änderungen der Bedingungen",
      body: "Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern. Änderungen werden auf dieser Seite mit einem aktualisierten Datum veröffentlicht. Die fortgesetzte Nutzung des Dienstes nach Änderungen stellt die Akzeptanz der neuen Bedingungen dar.",
    },
    {
      heading: "8. Kontakt",
      body: "Bei Fragen zu diesen Bedingungen öffne bitte ein Issue in unserem GitHub-Repository oder kontaktiere uns unter legal@mino.ink.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Cookie Policy
// ---------------------------------------------------------------------------

const cookiesEn: LegalDocument = {
  title: "Cookie Policy",
  lastUpdated: "2026-02-12",
  sections: [
    {
      heading: "1. What Are Cookies",
      body: "Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience.",
    },
    {
      heading: "2. Cookies We Use",
      body: "Mino uses only essential/functional cookies. These are strictly necessary for the website to function and include: your theme preference (dark/light), your language preference, your linked server profiles, and your cookie consent status. We do NOT use any analytics, advertising, or tracking cookies.",
    },
    {
      heading: "3. localStorage Usage",
      body: "Instead of traditional cookies, Mino primarily uses the browser's localStorage API to persist preferences. This data never leaves your browser and is not transmitted to any server. Stored items include: mino.theme (your color scheme preference), mino.locale (your language preference), mino.linkedServers.v1 (your server connection profiles), mino.cookieConsent (your consent status).",
    },
    {
      heading: "4. Third-Party Cookies",
      body: "Mino does not embed any third-party scripts, analytics, or advertising that would set cookies. Google Fonts are loaded from Google's CDN, which may set its own cookies per Google's privacy policy.",
    },
    {
      heading: "5. Managing Cookies",
      body: "You can clear all Mino data at any time by clearing your browser's localStorage for this domain. You can also use your browser's developer tools to inspect and remove individual items.",
    },
    {
      heading: "6. DSGVO/GDPR Compliance",
      body: "This cookie policy is compliant with the EU General Data Protection Regulation (DSGVO/GDPR). Since we only use essential cookies required for the basic functionality of the site, explicit consent is not legally required. However, we display a cookie banner as a transparency measure.",
    },
    {
      heading: "7. Contact",
      body: "For questions about our cookie practices, please open an issue on our GitHub repository or contact us at legal@mino.ink.",
    },
  ],
};

const cookiesEs: LegalDocument = {
  title: "Política de Cookies",
  lastUpdated: "2026-02-12",
  sections: [
    {
      heading: "1. Qué Son las Cookies",
      body: "Las cookies son pequeños archivos de texto almacenados en tu dispositivo cuando visitas un sitio web. Ayudan al sitio web a recordar tus preferencias y mejorar tu experiencia.",
    },
    {
      heading: "2. Cookies que Utilizamos",
      body: "Mino solo utiliza cookies esenciales/funcionales. Estas son estrictamente necesarias para que el sitio web funcione e incluyen: tu preferencia de tema (oscuro/claro), tu preferencia de idioma, tus perfiles de servidores vinculados y tu estado de consentimiento de cookies. NO utilizamos ninguna cookie de análisis, publicidad o seguimiento.",
    },
    {
      heading: "3. Uso de localStorage",
      body: "En lugar de cookies tradicionales, Mino utiliza principalmente la API localStorage del navegador para persistir preferencias. Estos datos nunca salen de tu navegador y no se transmiten a ningún servidor. Los elementos almacenados incluyen: mino.theme, mino.locale, mino.linkedServers.v1, mino.cookieConsent.",
    },
    {
      heading: "4. Cookies de Terceros",
      body: "Mino no integra scripts de terceros, análisis o publicidad que establezcan cookies. Google Fonts se carga desde el CDN de Google, que puede establecer sus propias cookies según la política de privacidad de Google.",
    },
    {
      heading: "5. Gestión de Cookies",
      body: "Puedes borrar todos los datos de Mino en cualquier momento limpiando el localStorage de tu navegador para este dominio.",
    },
    {
      heading: "6. Cumplimiento DSGVO/GDPR",
      body: "Esta política de cookies cumple con el Reglamento General de Protección de Datos de la UE (DSGVO/GDPR). Dado que solo utilizamos cookies esenciales, el consentimiento explícito no es legalmente necesario. Sin embargo, mostramos un banner de cookies como medida de transparencia.",
    },
    {
      heading: "7. Contacto",
      body: "Para preguntas sobre nuestras prácticas de cookies, abre un issue en nuestro repositorio de GitHub o contáctanos en legal@mino.ink.",
    },
  ],
};

const cookiesDe: LegalDocument = {
  title: "Cookie-Richtlinie",
  lastUpdated: "2026-02-12",
  sections: [
    {
      heading: "1. Was Sind Cookies",
      body: "Cookies sind kleine Textdateien, die auf deinem Gerät gespeichert werden, wenn du eine Website besuchst. Sie helfen der Website, deine Einstellungen zu speichern und dein Erlebnis zu verbessern.",
    },
    {
      heading: "2. Cookies, die Wir Verwenden",
      body: "Mino verwendet nur essenzielle/funktionale Cookies. Diese sind streng notwendig für die Funktion der Website und umfassen: deine Theme-Einstellung (dunkel/hell), deine Spracheinstellung, deine verknüpften Server-Profile und deinen Cookie-Zustimmungsstatus. Wir verwenden KEINE Analyse-, Werbe- oder Tracking-Cookies.",
    },
    {
      heading: "3. localStorage-Nutzung",
      body: "Anstelle von traditionellen Cookies verwendet Mino hauptsächlich die localStorage-API des Browsers. Diese Daten verlassen niemals deinen Browser und werden an keinen Server übertragen. Gespeicherte Elemente umfassen: mino.theme, mino.locale, mino.linkedServers.v1, mino.cookieConsent.",
    },
    {
      heading: "4. Cookies von Drittanbietern",
      body: "Mino bettet keine Drittanbieter-Skripte, Analysen oder Werbung ein, die Cookies setzen würden. Google Fonts werden vom Google CDN geladen, das möglicherweise eigene Cookies gemäß der Google-Datenschutzrichtlinie setzt.",
    },
    {
      heading: "5. Cookies Verwalten",
      body: "Du kannst alle Mino-Daten jederzeit löschen, indem du den localStorage deines Browsers für diese Domain löschst.",
    },
    {
      heading: "6. DSGVO-Konformität",
      body: "Diese Cookie-Richtlinie ist konform mit der EU-Datenschutz-Grundverordnung (DSGVO). Da wir nur essenzielle Cookies verwenden, die für die grundlegende Funktionalität der Website erforderlich sind, ist eine ausdrückliche Einwilligung rechtlich nicht erforderlich. Wir zeigen jedoch ein Cookie-Banner als Transparenzmaßnahme an.",
    },
    {
      heading: "7. Kontakt",
      body: "Bei Fragen zu unseren Cookie-Praktiken öffne bitte ein Issue in unserem GitHub-Repository oder kontaktiere uns unter legal@mino.ink.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------

const privacyEn: LegalDocument = {
  title: "Privacy Policy",
  lastUpdated: "2026-02-12",
  sections: [
    {
      heading: "1. Overview",
      body: "Mino is designed with privacy as a foundational principle. Your notes are stored on servers you control, and the mino.ink web client is a thin interface that does not process or store your content.",
    },
    {
      heading: "2. Data We Collect",
      body: "The mino.ink web client collects no personal data. All preferences (theme, language, server connections) are stored locally in your browser's localStorage and are never transmitted to Mino's infrastructure. If you sign in with Google (optional), we store only your email address and the list of servers you've linked — never your note content.",
    },
    {
      heading: "3. Data Processing",
      body: "All note content is processed entirely by your self-hosted Mino server. The mino.ink web client acts as a passthrough — API requests go directly from your browser to your server. Mino's infrastructure never sees, processes, or stores your note data.",
    },
    {
      heading: "4. Data Storage",
      body: "Notes are stored as plain .md files on your server's file system. The SQLite index database is also stored on your server. No note data is ever stored on mino.ink's infrastructure unless you opt into the free managed tier, in which case data is stored on our servers with encryption at rest.",
    },
    {
      heading: "5. Third-Party Services",
      body: "Google Fonts: loaded from Google's CDN for typography. Google OAuth: optional sign-in (only stores email and server list). AI Providers: if you configure an AI agent, API keys and requests are sent directly from your server to the AI provider. Mino does not proxy or log these requests.",
    },
    {
      heading: "6. Your Rights (DSGVO/GDPR)",
      body: "Under the DSGVO/GDPR, you have the right to: access your personal data, rectify inaccurate data, erase your data (\"right to be forgotten\"), restrict processing, data portability, and object to processing. Since Mino stores almost no personal data on its infrastructure, most of these rights are automatically satisfied. To exercise any right related to a Google sign-in account, contact us at legal@mino.ink.",
    },
    {
      heading: "7. Data Minimization",
      body: "In compliance with DSGVO Article 5(1)(c), Mino collects only the minimum data necessary for its function. We do not use analytics, tracking pixels, fingerprinting, or any other surveillance technology.",
    },
    {
      heading: "8. Data Breach Notification",
      body: "In the unlikely event of a data breach affecting the mino.ink managed tier, we will notify affected users within 72 hours as required by DSGVO Article 33. Self-hosted users are responsible for their own server security.",
    },
    {
      heading: "9. Contact / DPO",
      body: "For privacy inquiries or to contact our data protection officer, email legal@mino.ink or open an issue on our GitHub repository.",
    },
  ],
};

const privacyEs: LegalDocument = {
  title: "Política de Privacidad",
  lastUpdated: "2026-02-12",
  sections: [
    {
      heading: "1. Descripción General",
      body: "Mino está diseñado con la privacidad como principio fundamental. Tus notas se almacenan en servidores que tú controlas, y el cliente web mino.ink es una interfaz ligera que no procesa ni almacena tu contenido.",
    },
    {
      heading: "2. Datos que Recopilamos",
      body: "El cliente web mino.ink no recopila datos personales. Todas las preferencias se almacenan localmente en el localStorage de tu navegador. Si te registras con Google (opcional), solo almacenamos tu dirección de email y la lista de servidores vinculados — nunca el contenido de tus notas.",
    },
    {
      heading: "3. Procesamiento de Datos",
      body: "Todo el contenido de notas se procesa completamente en tu servidor Mino autoalojado. El cliente web mino.ink actúa como un paso directo. La infraestructura de Mino nunca ve, procesa ni almacena tus datos de notas.",
    },
    {
      heading: "4. Almacenamiento de Datos",
      body: "Las notas se almacenan como archivos .md en el sistema de archivos de tu servidor. Ningún dato de notas se almacena en la infraestructura de mino.ink a menos que optes por el nivel administrado gratuito.",
    },
    {
      heading: "5. Servicios de Terceros",
      body: "Google Fonts: cargado desde el CDN de Google. Google OAuth: inicio de sesión opcional. Proveedores de IA: si configuras un agente, las claves API y solicitudes se envían directamente desde tu servidor al proveedor de IA.",
    },
    {
      heading: "6. Tus Derechos (DSGVO/GDPR)",
      body: "Bajo el DSGVO/GDPR, tienes derecho a: acceder a tus datos personales, rectificar datos inexactos, borrar tus datos, restringir el procesamiento, portabilidad de datos y oponerte al procesamiento. Para ejercer cualquier derecho, contacta legal@mino.ink.",
    },
    {
      heading: "7. Minimización de Datos",
      body: "En cumplimiento con el Artículo 5(1)(c) del DSGVO, Mino recopila solo los datos mínimos necesarios. No usamos análisis, píxeles de seguimiento, fingerprinting u otra tecnología de vigilancia.",
    },
    {
      heading: "8. Notificación de Brechas de Datos",
      body: "En caso de brecha de datos, notificaremos a los usuarios afectados dentro de 72 horas según el Artículo 33 del DSGVO.",
    },
    {
      heading: "9. Contacto / DPO",
      body: "Para consultas de privacidad, envía un email a legal@mino.ink o abre un issue en nuestro repositorio de GitHub.",
    },
  ],
};

const privacyDe: LegalDocument = {
  title: "Datenschutzerklärung",
  lastUpdated: "2026-02-12",
  sections: [
    {
      heading: "1. Überblick",
      body: "Mino ist mit Datenschutz als grundlegendem Prinzip konzipiert. Deine Notizen werden auf Servern gespeichert, die du kontrollierst, und der mino.ink Web-Client ist eine dünne Schnittstelle, die deine Inhalte nicht verarbeitet oder speichert.",
    },
    {
      heading: "2. Daten, die Wir Erheben",
      body: "Der mino.ink Web-Client erhebt keine personenbezogenen Daten. Alle Einstellungen werden lokal im localStorage deines Browsers gespeichert. Wenn du dich mit Google anmeldest (optional), speichern wir nur deine E-Mail-Adresse und die Liste der verknüpften Server — niemals den Inhalt deiner Notizen.",
    },
    {
      heading: "3. Datenverarbeitung",
      body: "Alle Notizinhalte werden vollständig auf deinem selbst gehosteten Mino-Server verarbeitet. Der mino.ink Web-Client fungiert als Durchleitung. Die Infrastruktur von Mino sieht, verarbeitet oder speichert deine Notizdaten niemals.",
    },
    {
      heading: "4. Datenspeicherung",
      body: "Notizen werden als .md-Dateien im Dateisystem deines Servers gespeichert. Keine Notizdaten werden jemals auf der Infrastruktur von mino.ink gespeichert, es sei denn, du entscheidest dich für die kostenlose verwaltete Stufe.",
    },
    {
      heading: "5. Drittanbieter-Dienste",
      body: "Google Fonts: vom Google CDN geladen. Google OAuth: optionale Anmeldung. KI-Anbieter: Wenn du einen Agenten konfigurierst, werden API-Schlüssel und Anfragen direkt von deinem Server an den KI-Anbieter gesendet.",
    },
    {
      heading: "6. Deine Rechte (DSGVO)",
      body: "Gemäß der DSGVO hast du das Recht auf: Zugang zu deinen personenbezogenen Daten, Berichtigung unrichtiger Daten, Löschung deiner Daten (\"Recht auf Vergessenwerden\"), Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gegen die Verarbeitung. Kontaktiere legal@mino.ink zur Ausübung deiner Rechte.",
    },
    {
      heading: "7. Datenminimierung",
      body: "In Übereinstimmung mit Artikel 5(1)(c) der DSGVO erhebt Mino nur die minimal notwendigen Daten. Wir verwenden keine Analysen, Tracking-Pixel, Fingerprinting oder andere Überwachungstechnologien.",
    },
    {
      heading: "8. Benachrichtigung bei Datenschutzverletzungen",
      body: "Im unwahrscheinlichen Fall einer Datenschutzverletzung werden wir betroffene Nutzer innerhalb von 72 Stunden gemäß Artikel 33 der DSGVO benachrichtigen.",
    },
    {
      heading: "9. Kontakt / DSB",
      body: "Für Datenschutzanfragen sende eine E-Mail an legal@mino.ink oder öffne ein Issue in unserem GitHub-Repository.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

const legalDocs: Record<"terms" | "cookies" | "privacy", Record<Locale, LegalDocument>> = {
  terms: { en: termsEn, es: termsEs, de: termsDe },
  cookies: { en: cookiesEn, es: cookiesEs, de: cookiesDe },
  privacy: { en: privacyEn, es: privacyEs, de: privacyDe },
};

/** Get a legal document by type and locale. */
export function getLegalDocument(
  type: "terms" | "cookies" | "privacy",
  locale: Locale,
): LegalDocument {
  return legalDocs[type][locale] ?? legalDocs[type].en;
}
