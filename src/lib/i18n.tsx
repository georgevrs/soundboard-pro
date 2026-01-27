import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";

type Language = "en" | "el";

type TranslationDict = Record<string, string>;

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const translations: Record<Language, TranslationDict> = {
  en: {
    // General
    "app.name": "Soundboard Commander",
    "app.proTip": "Pro tip",

    // Toolbar / layout
    "toolbar.soundsCount": "{{count}} sounds",
    "toolbar.addSound": "Add Sound",
    "toolbar.sort.recent": "Recent",
    "toolbar.sort.name": "Name",
    "toolbar.sort.plays": "Most Played",

    // Sidebar
    "sidebar.searchPlaceholder": "Search sounds...",
    "sidebar.nav.library": "Sound Library",
    "sidebar.nav.shortcuts": "Shortcuts",
    "sidebar.nav.settings": "Settings",
    "sidebar.sources": "Sources",
    "sidebar.tags": "Tags",
    "sidebar.addSound": "Add Sound",

    // Empty state
    "empty.title": "Welcome to Soundboard Commander",
    "empty.subtitle":
      "Your personal soundboard with global keyboard shortcuts. Add your first sound to get started!",
    "empty.addFirst": "Add Your First Sound",
    "empty.directTitle": "Direct URLs",
    "empty.directDesc": "Link to MP3, WAV, or OGG audio files",
    "empty.youtubeTitle": "YouTube",
    "empty.youtubeDesc": "Auto-download audio from YouTube URLs",
    "empty.localTitle": "Local Files",
    "empty.localDesc": "Use audio files from your computer",
    "empty.proTipText":
      "After adding sounds, bind keyboard shortcuts to trigger them instantly — even when the app is running in the background!",

    // Create sound dialog
    "createSound.title": "Add New Sound",
    "createSound.description":
      "Create a new sound for your soundboard. You can add it from a URL, YouTube, or local file.",
    "createSound.nameLabel": "Name *",
    "createSound.namePlaceholder": "e.g., Air Horn",
    "createSound.descriptionLabel": "Description",
    "createSound.descriptionPlaceholder": "Optional description",
    "createSound.tagsLabel": "Tags",
    "createSound.tagsPlaceholder": "funny, alert, meme (comma-separated)",
    "createSound.sourceTypeLabel": "Source Type *",
    "createSound.sourceType.direct": "Direct URL",
    "createSound.sourceType.youtube": "YouTube",
    "createSound.sourceType.local": "Local File",
    "createSound.youtubeUrlLabel": "YouTube URL *",
    "createSound.audioUrlLabel": "Audio URL *",
    "createSound.youtubeUrlPlaceholder": "https://youtube.com/watch?v=...",
    "createSound.audioUrlPlaceholder": "https://example.com/sound.mp3",
    "createSound.youtubeHint": "The audio will be downloaded automatically after creation.",
    "createSound.trimStartLabel": "Trim Start (seconds)",
    "createSound.trimStartHelp": "Start playing from this time (optional)",
    "createSound.trimEndLabel": "Trim End (seconds)",
    "createSound.trimEndHelp": "Stop playing at this time (optional)",
    "createSound.localFileLabel": "Audio File *",
    "createSound.localFileButton": "Choose Audio File",
    "createSound.localFileSelected": "Selected: {{file}}",
    "createSound.localFileHelp": "Supported formats: MP3, WAV, OGG, M4A, FLAC",
    "createSound.volumeLabel": "Volume (0-100)",
    "createSound.coverLabel": "Cover Image (Optional)",
    "createSound.coverSelect": "Select Cover Image",
    "createSound.coverChange": "Change Image",
    "createSound.coverNone": "No cover image selected",
    "createSound.coverHelp": "Upload a cover image for this sound (JPG, PNG, etc.)",
    "createSound.cancel": "Cancel",
    "createSound.submitIdle": "Create Sound",
    "createSound.submitPending": "Creating...",
    "createSound.progressTitle": "Creating Sound",

    // Generic toasts
    "toast.error": "Error",
    "toast.success": "Success",

    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Configure app behavior and paths",
    "settings.audioSection": "Audio",
    "settings.audioDeviceLabel": "Audio Output Device",
    "settings.audioDevicePlaceholder": "pipewire/alsa_output... (leave empty for default)",
    "settings.audioDeviceHelp": "Device string passed to mpv's --audio-device flag",
    "settings.defaultVolumeLabel": "Default Volume",
    "settings.stopPreviousTitle": "Stop Previous on Play",
    "settings.stopPreviousDesc": "Stop any playing sound when a new one starts",
    "settings.allowOverlappingTitle": "Allow Overlapping",
    "settings.allowOverlappingDesc": "Allow multiple sounds to play simultaneously",
    "settings.pathsSection": "Command Paths",
    "settings.mpvPathLabel": "mpv Path",
    "settings.mpvPathPlaceholder": "/usr/bin/mpv",
    "settings.mpvPathHelp": 'Path to mpv executable. Use "mpv" if it\'s in your PATH',
    "settings.ytdlpPathLabel": "yt-dlp Path",
    "settings.ytdlpPathPlaceholder": "/usr/bin/yt-dlp",
    "settings.ytdlpPathHelp": "Path to yt-dlp for downloading YouTube audio",
    "settings.dataSection": "Data Management",
    "settings.exportLibrary": "Export Library",
    "settings.importLibrary": "Import Library",
    "settings.saving": "Saving...",
    "settings.save": "Save Settings",
    "settings.loading": "Loading settings...",
    "settings.toastSaved": "Settings saved successfully",
    "settings.toastExportTitle": "Coming Soon",
    "settings.toastExportDesc": "Export functionality will be available soon",
    "settings.toastImportTitle": "Coming Soon",
    "settings.toastImportDesc": "Import functionality will be available soon",

    // Footer
    "footer.rights": "All rights reserved.",
    "footer.github": "GitHub",

    // Language switch
    "lang.en": "EN",
    "lang.el": "ΕΛ",
  },
  el: {
    // General
    "app.name": "KeySound Commander",
    "app.proTip": "Pro tip",

    // Toolbar / layout
    "toolbar.soundsCount": "{{count}} ήχοι",
    "toolbar.addSound": "Προσθήκη ήχου",
    "toolbar.sort.recent": "Πρόσφατα",
    "toolbar.sort.name": "Όνομα",
    "toolbar.sort.plays": "Περισσότερες αναπαραγωγές",

    // Sidebar
    "sidebar.searchPlaceholder": "Αναζήτηση ήχων...",
    "sidebar.nav.library": "Βιβλιοθήκη ήχων",
    "sidebar.nav.shortcuts": "Συντομεύσεις",
    "sidebar.nav.settings": "Ρυθμίσεις",
    "sidebar.sources": "Πηγές",
    "sidebar.tags": "Ετικέτες",
    "sidebar.addSound": "Προσθήκη ήχου",

    // Empty state
    "empty.title": "Καλώς ήρθες στο Soundboard Commander",
    "empty.subtitle":
      "Το προσωπικό σου soundboard με καθολικές συντομεύσεις. Πρόσθεσε τον πρώτο σου ήχο για να ξεκινήσεις!",
    "empty.addFirst": "Πρόσθεσε τον πρώτο σου ήχο",
    "empty.directTitle": "Άμεσοι σύνδεσμοι",
    "empty.directDesc": "Σύνδεσε αρχεία ήχου MP3, WAV ή OGG",
    "empty.youtubeTitle": "YouTube",
    "empty.youtubeDesc": "Αυτόματη λήψη ήχου από συνδέσμους YouTube",
    "empty.localTitle": "Τοπικά αρχεία",
    "empty.localDesc": "Χρησιμοποίησε αρχεία ήχου από τον υπολογιστή σου",
    "empty.proTipText":
      "Αφού προσθέσεις ήχους, δέσε συντομεύσεις πληκτρολογίου για να τους ενεργοποιείς άμεσα — ακόμα κι όταν η εφαρμογή τρέχει στο παρασκήνιο!",

    // Create sound dialog
    "createSound.title": "Προσθήκη νέου ήχου",
    "createSound.description":
      "Δημιούργησε έναν νέο ήχο για το soundboard σου. Μπορείς να τον προσθέσεις από URL, YouTube ή τοπικό αρχείο.",
    "createSound.nameLabel": "Όνομα *",
    "createSound.namePlaceholder": "π.χ. Air Horn",
    "createSound.descriptionLabel": "Περιγραφή",
    "createSound.descriptionPlaceholder": "Προαιρετική περιγραφή",
    "createSound.tagsLabel": "Ετικέτες",
    "createSound.tagsPlaceholder": "funny, alert, meme (χωρισμένες με κόμμα)",
    "createSound.sourceTypeLabel": "Τύπος πηγής *",
    "createSound.sourceType.direct": "Άμεσο URL",
    "createSound.sourceType.youtube": "YouTube",
    "createSound.sourceType.local": "Τοπικό αρχείο",
    "createSound.youtubeUrlLabel": "YouTube URL *",
    "createSound.audioUrlLabel": "URL ήχου *",
    "createSound.youtubeUrlPlaceholder": "https://youtube.com/watch?v=...",
    "createSound.audioUrlPlaceholder": "https://example.com/sound.mp3",
    "createSound.youtubeHint": "Ο ήχος θα κατέβει αυτόματα μετά τη δημιουργία.",
    "createSound.trimStartLabel": "Έναρξη περικοπής (δευτερόλεπτα)",
    "createSound.trimStartHelp": "Έναρξη αναπαραγωγής από αυτό το σημείο (προαιρετικό)",
    "createSound.trimEndLabel": "Λήξη περικοπής (δευτερόλεπτα)",
    "createSound.trimEndHelp": "Σταμάτημα αναπαραγωγής σε αυτό το σημείο (προαιρετικό)",
    "createSound.localFileLabel": "Αρχείο ήχου *",
    "createSound.localFileButton": "Επιλογή αρχείου ήχου",
    "createSound.localFileSelected": "Επιλεγμένο: {{file}}",
    "createSound.localFileHelp": "Υποστηριζόμενα: MP3, WAV, OGG, M4A, FLAC",
    "createSound.volumeLabel": "Ένταση (0-100)",
    "createSound.coverLabel": "Εξώφυλλο (προαιρετικό)",
    "createSound.coverSelect": "Επιλογή εικόνας εξωφύλλου",
    "createSound.coverChange": "Αλλαγή εικόνας",
    "createSound.coverNone": "Δεν έχει επιλεγεί εικόνα εξωφύλλου",
    "createSound.coverHelp": "Ανέβασε εικόνα εξωφύλλου για αυτόν τον ήχο (JPG, PNG, κλπ.)",
    "createSound.cancel": "Ακύρωση",
    "createSound.submitIdle": "Δημιουργία ήχου",
    "createSound.submitPending": "Γίνεται δημιουργία...",
    "createSound.progressTitle": "Δημιουργία ήχου",

    // Generic toasts
    "toast.error": "Σφάλμα",
    "toast.success": "Επιτυχία",

    // Settings
    "settings.title": "Ρυθμίσεις",
    "settings.subtitle": "Ρύθμισε τη συμπεριφορά και τα μονοπάτια της εφαρμογής",
    "settings.audioSection": "Ήχος",
    "settings.audioDeviceLabel": "Συσκευή εξόδου ήχου",
    "settings.audioDevicePlaceholder": "pipewire/alsa_output... (άφησέ το κενό για προεπιλογή)",
    "settings.audioDeviceHelp":
      "Συμβολοσειρά συσκευής που περνάει στο mpv μέσω της παραμέτρου --audio-device",
    "settings.defaultVolumeLabel": "Προεπιλεγμένη ένταση",
    "settings.stopPreviousTitle": "Σταμάτημα προηγούμενου στην αναπαραγωγή",
    "settings.stopPreviousDesc": "Σταματά κάθε ενεργό ήχο όταν ξεκινά νέος",
    "settings.allowOverlappingTitle": "Επικάλυψη ήχων",
    "settings.allowOverlappingDesc": "Επιτρέπει την ταυτόχρονη αναπαραγωγή πολλών ήχων",
    "settings.pathsSection": "Μονοπάτια εντολών",
    "settings.mpvPathLabel": "Διαδρομή mpv",
    "settings.mpvPathPlaceholder": "/usr/bin/mpv",
    "settings.mpvPathHelp":
      'Διαδρομή προς το εκτελέσιμο του mpv. Χρησιμοποίησε "mpv" αν υπάρχει στο PATH σου',
    "settings.ytdlpPathLabel": "Διαδρομή yt-dlp",
    "settings.ytdlpPathPlaceholder": "/usr/bin/yt-dlp",
    "settings.ytdlpPathHelp": "Διαδρομή προς το yt-dlp για λήψη ήχου από YouTube",
    "settings.dataSection": "Διαχείριση δεδομένων",
    "settings.exportLibrary": "Εξαγωγή βιβλιοθήκης",
    "settings.importLibrary": "Εισαγωγή βιβλιοθήκης",
    "settings.saving": "Γίνεται αποθήκευση...",
    "settings.save": "Αποθήκευση ρυθμίσεων",
    "settings.loading": "Φόρτωση ρυθμίσεων...",
    "settings.toastSaved": "Οι ρυθμίσεις αποθηκεύτηκαν με επιτυχία",
    "settings.toastExportTitle": "Έρχεται σύντομα",
    "settings.toastExportDesc": "Η λειτουργία εξαγωγής θα είναι διαθέσιμη σύντομα",
    "settings.toastImportTitle": "Έρχεται σύντομα",
    "settings.toastImportDesc": "Η λειτουργία εισαγωγής θα είναι διαθέσιμη σύντομα",

    // Footer
    "footer.rights": "Όλα τα δικαιώματα διατηρούνται.",
    "footer.github": "GitHub",

    // Language switch
    "lang.en": "EN",
    "lang.el": "ΕΛ",
  },
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string, vars?: Record<string, string | number>): string => {
      const dict = translations[language] || translations.en;
      let template = dict[key] ?? translations.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          template = template.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        });
      }
      return template;
    };

    return {
      language,
      setLanguage,
      t,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return ctx;
}

