
import React, { createContext, useContext, useState, ReactNode } from 'react';

// --- Types ---
export type Language = 'it' | 'en' | 'es' | 'fr' | 'de' | 'nl';

export interface Translations {
    // App / Nav
    app_name: string;
    logout: string;
    home: string;
    create: string;
    profile: string;
    open_profile: string;
    my_profile: string;
    create_trip_aria: string;

    // Auth
    login_tab: string;
    register_tab: string;
    full_name: string;
    uni_email: string;
    password: string;
    default_role: string;
    role_both: string;
    role_driver: string;
    role_passenger: string;
    login_action: string;
    register_action: string;
    auth_error_password: string;
    auth_error_not_found: string;
    auth_error_exists: string;
    auth_pnrr_contribution: string;
    auth_pnrr_missions: string;
    auth_subtitle: string;
    auth_verify_email_sent: string;
    auth_verify_required: string;
    auth_resend_verification: string;
    auth_forgot_password: string;
    auth_forgot_password_desc: string;
    auth_send_reset_link: string;
    auth_reset_password: string;
    auth_new_password: string;
    auth_confirm_password: string;
    auth_reset_success: string;
    auth_verify_success: string;
    auth_verify_expired: string;
    auth_reset_expired: string;
    auth_password_mismatch: string;

    // Dashboard - Header
    eco_profile: string;
    welcome_user: string;
    how_it_works: string;
    last_save: string;
    eco_credits: string;

    // Dashboard - Notifications
    notifications: string;
    no_news: string;

    // Dashboard - Main Controls
    explore_offers: string;
    my_commitments: string;
    train_study: string;
    list_view: string;
    map_view: string;

    // Dashboard - Create Section
    create_impact_title: string;
    create_impact_desc: string;
    propose_trip_btn: string;

    // Dashboard - Filters
    search_placeholder: string;
    support_m5: string;
    match_available: string;
    your_trips: string;
    mamadb_protected: string;

    // Empty State
    no_trips_found: string;
    reset_filters: string;

    // Right Sidebar
    pnrr_missions_title: string;
    pnrr_missions_desc: string;
    learn_more: string;

    // TripCard
    passengers_on_board: string;
    vehicle_type: string;
    your_proposal: string;
    booked: string;
    seat: string;
    seats: string;
    co2_saved_kg: string;
    mission_4_tutoring: string;
    mission_5_inclusion: string;
    driver_label: string;
    me: string;
    book_now: string;
    cancel_unexpected: string;
    cancel_commitment: string;

    // SubjectDropdown
    filter_by_subject: string;
    all_subjects: string;

    // HelpModal
    help_title: string;
    help_desc: string;
    pnrr_missions: string;
    mission_3_title: string;
    mission_3_desc: string;
    mission_4_title: string;
    mission_4_desc: string;
    mission_5_title: string;
    mission_5_desc: string;
    quick_guides: string;
    earn_credits_guide: string;
    safety_trust_guide: string;
    inclusion_guide: string;
    close_guide: string;

    // Leaderboard
    leaderboard_title: string;
    top_5: string;
    you_suffix: string;
    level: string;
    credits: string;

    // ProfileModal
    eco_identity: string;
    mama_db_desc: string;
    base_info: string;
    name_placeholder: string;
    role_flexible: string;
    role_driver_only: string;
    role_passenger_only: string;
    expertise: string;
    add_subject: string;
    add_btn: string;
    accessibility_needs: string;
    add_need: string;
    save_changes: string;
    manage_db: string;
    hide_data: string;
    export_json: string;
    reset_all: string;
    confirm_reset: string;

    // OfferRideModal
    propose_trip_header: string;
    propose_trip_subtitle: string;
    route_details: string;
    departure_point: string;
    destination_point: string;
    select_departure: string;
    select_destination: string;
    date_time: string;
    available_seats: string;
    peer_tutoring: string;
    subject_optional: string;
    social_inclusion: string;
    assist_special_needs: string;
    publish_trip: string;
    error_select_departure: string;
    error_select_destination: string;
    error_select_datetime: string;
    error_past_datetime: string;
    error_same_location: string;

    // Common
    loading: string;
    success: string;
    error: string;

    // MapView
    map_title: string;
    map_subtitle: string;
    map_footer: string;
    map_other: string;
    vs_prefix: string;

    // Dashboard Notifications & Feedback
    booking_success: string;
    booking_notification: string;
    cancel_notification: string;
    trip_cancelled_notification: string;
    unknown_destination: string;
    participation_cancelled: string;
    commitment_removed: string;

    footer_about: string;
    footer_privacy: string;
    footer_terms: string;
    footer_contact: string;
    footer_pnrr: string;
    footer_copyright: string;
}

// --- Translations Data ---
export const translations: Record<Language, Translations> = {
    it: {
        app_name: 'EcoShift Hub',
        logout: 'Esci',
        home: 'Home',
        create: 'Crea',
        profile: 'Profilo',
        open_profile: 'Apri Profilo',
        my_profile: 'Il mio profilo',
        create_trip_aria: 'Crea Viaggio',

        login_tab: 'ACCEDI',
        register_tab: 'REGISTRATI',
        full_name: 'Nome Completo',
        uni_email: 'Email Universitaria',
        password: 'Password',
        default_role: 'Ruolo Predefinito',
        role_both: 'Passeggero & Autista',
        role_driver: 'Solo Autista',
        role_passenger: 'Solo Passeggero',
        login_action: 'ACCEDI ORA',
        register_action: 'CREA ACCOUNT',
        auth_error_password: 'Password non corretta. Riprova.',
        auth_error_not_found: 'Utente non trovato. Controlla le credenziali o registrati.',
        auth_error_exists: 'Utente già registrato con questa email. Prova ad accedere.',
        auth_pnrr_contribution: 'Con il contributo del',
        auth_pnrr_missions: 'PNNR M4C2',
        auth_subtitle: 'Accedi per pianificare i tuoi viaggi sostenibili',
        auth_verify_email_sent: 'Registrazione avvenuta! Controlla la tua email per verificare il tuo account.',
        auth_verify_required: 'Verifica la tua email prima di accedere. Controlla la casella (e lo spam) e clicca sul link.',
        auth_resend_verification: 'Rinvia email di verifica',
        auth_forgot_password: 'Password dimenticata?',
        auth_forgot_password_desc: 'Inserisci l\'email con cui ti sei registrato: ti invieremo un link per reimpostare la password.',
        auth_send_reset_link: 'Invia link',
        auth_reset_password: 'Reimposta password',
        auth_new_password: 'Nuova password',
        auth_confirm_password: 'Conferma password',
        auth_reset_success: 'Password aggiornata. Ora puoi accedere.',
        auth_verify_success: 'Email verificata! Ora puoi accedere.',
        auth_verify_expired: 'Link scaduto. Richiedi una nuova email di verifica.',
        auth_reset_expired: 'Link scaduto. Richiedi un nuovo link per reimpostare la password.',
        auth_password_mismatch: 'Le due password non coincidono.',

        eco_profile: 'Eco-Profilo',
        welcome_user: 'Ciao {name}, oggi sei un driver o un tutor?',
        how_it_works: '❓ Come funziona',
        last_save: 'Ultimo salvataggio: {time}',
        eco_credits: 'Eco-Credits 💎',

        notifications: 'Notifiche',
        no_news: 'Nessuna novità.',

        explore_offers: 'Esplora Offerte',
        my_commitments: 'Miei Impegni',
        train_study: '🚆 Treno & Studio',
        list_view: 'LISTA',
        map_view: 'MAPPA',

        create_impact_title: 'Crea un nuovo impatto',
        create_impact_desc: 'I dati saranno salvati istantaneamente nel MamaDB.',
        propose_trip_btn: 'Proponi Viaggio +',

        search_placeholder: 'Cerca destinazione o materia...',
        support_m5: '♿ Supporto M5',
        match_available: 'Match Disponibili',
        your_trips: 'I Tuoi Viaggi',
        mamadb_protected: 'MamaDB Protetto 🛡️',

        no_trips_found: 'Nessun viaggio trovato nel database.',
        reset_filters: 'Ripristina filtri',

        pnrr_missions_title: 'Missions PNRR',
        pnrr_missions_desc: 'Contribuisci attivamente agli obiettivi di inclusione e sostenibilità del tuo ateneo.',
        learn_more: 'Scopri di più',

        passengers_on_board: 'Passeggeri a bordo',
        vehicle_type: 'Auto',
        your_proposal: 'Tua Proposta',
        booked: 'Prenotato',
        seat: 'posto',
        seats: 'posti',
        co2_saved_kg: 'kg CO2',
        mission_4_tutoring: 'Missione 4: {subject}',
        mission_5_inclusion: 'Missione 5: Inclusione',
        driver_label: 'Driver',
        me: 'Tu',
        book_now: 'Prenota ora',
        cancel_unexpected: 'Annulla imprevisto',
        cancel_commitment: 'Cancella impegno',

        filter_by_subject: 'Filtra per materia di studio',
        all_subjects: 'Tutte le materie',

        help_title: 'Guida EcoShift Hub',
        help_desc: 'EcoShift Hub è la piattaforma di Inclusive Smart Mobility dedicata agli studenti universitari, finanziata nell\'ambito delle iniziative PNRR.',
        pnrr_missions: 'Missioni PNRR Supportate',
        mission_3_title: 'Missione 3: Mobilità Sostenibile',
        mission_3_desc: 'Riduciamo l\'impatto ambientale condividendo i tragitti quotidiani verso il campus.',
        mission_4_title: 'Missione 4: Peer Tutoring',
        mission_4_desc: 'Sfrutta il tempo in viaggio per studiare insieme o ricevere supporto in materie specifiche.',
        mission_5_title: 'Missione 5: Inclusione Sociale',
        mission_5_desc: 'Garantiamo accessibilità universale offrendo supporto specifico a chi ha bisogni speciali.',
        quick_guides: 'Guide Rapide',
        earn_credits_guide: 'Come guadagnare Eco-Credits',
        safety_trust_guide: 'Protocollo Sicurezza & Fiducia',
        inclusion_guide: 'Guida all\'Assistenza Inclusiva',
        close_guide: 'Ho capito, grazie!',

        leaderboard_title: 'Eco-Guerrieri',
        top_5: 'Top 5',
        you_suffix: '(Tu)',
        level: 'Livello',
        credits: 'Credits',

        eco_identity: 'Eco-Identity',
        mama_db_desc: 'Dati salvati in tempo reale nel MamaDB',
        base_info: 'Informazioni Base',
        name_placeholder: 'Nome e Cognome',
        role_flexible: 'Mobilità Flessibile',
        role_driver_only: 'Solo Conducente',
        role_passenger_only: 'Solo Passeggero',
        expertise: 'Expertise (M4)',
        add_subject: 'Aggiungi una materia...',
        add_btn: 'ADD',
        accessibility_needs: 'Esigenze di Accessibilità (M5)',
        add_need: 'Aggiungi esigenza (es. Sedia a rotelle)...',
        save_changes: 'Salva Modifiche',
        manage_db: 'Gestione Database MamaDB',
        hide_data: 'Nascondi Dati',
        export_json: 'Esporta JSON',
        reset_all: 'Reset Totale',
        confirm_reset: 'Sei sicuro? Tutti i dati locali verranno eliminati.',

        propose_trip_header: 'Proponi un Viaggio',
        propose_trip_subtitle: 'Aiuta la community e guadagna Eco-Credits (+50💎)',
        route_details: 'Dettagli Percorso (M3)',
        departure_point: 'Punto di Partenza',
        destination_point: 'Destinazione',
        select_departure: 'Seleziona partenza...',
        select_destination: 'Seleziona destinazione...',
        date_time: 'Data e Ora',
        available_seats: 'Posti Disponibili',
        peer_tutoring: 'Peer Tutoring (M4)',
        subject_optional: 'Materia (Opzionale)',
        social_inclusion: 'Inclusione Sociale (M5)',
        assist_special_needs: 'Offro assistenza per bisogni speciali',
        publish_trip: 'Pubblica Viaggio 🚀',
        error_select_departure: 'Seleziona un punto di partenza',
        error_select_destination: 'Seleziona una destinazione',
        error_select_datetime: 'Seleziona data e ora',
        error_past_datetime: 'La data non può essere nel passato',
        error_same_location: 'Partenza e destinazione devono essere diverse',

        loading: 'Caricamento...',
        success: 'Successo',
        error: 'Errore',

        map_title: 'Milano Live Hub',
        map_subtitle: 'Spostamenti Sostenibili',
        map_footer: 'EcoShift Interactive Intelligence',
        map_other: 'Altro',
        vs_prefix: 'vs',

        booking_success: 'Viaggio prenotato! +{credits}💎',
        booking_notification: '{name} ha prenotato {seats} {seatLabel} per {to}!',
        cancel_notification: '{name} ha annullato la prenotazione per {to}.',
        trip_cancelled_notification: 'Il viaggio per {to} è stato cancellato dal driver.',
        unknown_destination: 'Destinazione sconosciuta',
        participation_cancelled: 'Partecipazione annollata.',
        commitment_removed: 'Impegno rimosso.',

        footer_about: 'Chi siamo',
        footer_privacy: 'Privacy',
        footer_terms: 'Termini',
        footer_contact: 'Contatti',
        footer_pnrr: 'Progetto PNRR',
        footer_copyright: '© 2025 EcoShift Hub. Tutti i diritti riservati.'
    },
    en: {
        app_name: 'EcoShift Hub',
        logout: 'Logout',
        home: 'Home',
        create: 'Create',
        profile: 'Profile',
        open_profile: 'Open Profile',
        my_profile: 'My Profile',
        create_trip_aria: 'Create Trip',

        login_tab: 'LOGIN',
        register_tab: 'REGISTER',
        full_name: 'Full Name',
        uni_email: 'University Email',
        password: 'Password',
        default_role: 'Default Role',
        role_both: 'Driver & Passenger',
        role_driver: 'Driver Only',
        role_passenger: 'Passenger Only',
        login_action: 'ENTER HUB',
        register_action: 'CREATE ECO PROFILE',
        auth_error_password: 'Incorrect password.',
        auth_error_not_found: 'User not found. Register to start!',
        auth_error_exists: 'This email is already registered.',
        auth_pnrr_contribution: 'By participating you contribute to',
        auth_pnrr_missions: 'PNRR Missions 3, 4 and 5',
        auth_subtitle: 'Inclusive University Mobility',
        auth_verify_email_sent: 'Check your email: we sent you a link to verify your address.',
        auth_verify_required: 'Verify your email before logging in. Check your inbox (and spam) and click the link.',
        auth_resend_verification: 'Resend verification email',
        auth_forgot_password: 'Forgot password?',
        auth_forgot_password_desc: 'Enter the email you registered with and we\'ll send you a link to reset your password.',
        auth_send_reset_link: 'Send link',
        auth_reset_password: 'Reset password',
        auth_new_password: 'New password',
        auth_confirm_password: 'Confirm password',
        auth_reset_success: 'Password updated. You can now log in.',
        auth_verify_success: 'Email verified! You can now log in.',
        auth_verify_expired: 'Link expired. Request a new verification email.',
        auth_reset_expired: 'Link expired. Request a new password reset link.',
        auth_password_mismatch: 'The two passwords do not match.',

        eco_profile: 'Eco-Profile',
        welcome_user: 'Hi {name}, are you a driver or a tutor today?',
        how_it_works: '❓ How it works',
        last_save: 'Last saved: {time}',
        eco_credits: 'Eco-Credits 💎',

        notifications: 'Notifications',
        no_news: 'No news.',

        explore_offers: 'Explore Offers',
        my_commitments: 'My Commitments',
        train_study: '🚆 Train & Study',
        list_view: 'LIST',
        map_view: 'MAP',

        create_impact_title: 'Create a new impact',
        create_impact_desc: 'Data will be instantly saved in MamaDB.',
        propose_trip_btn: 'Propose Trip +',

        search_placeholder: 'Search destination or subject...',
        support_m5: '♿ M5 Support',
        match_available: 'Available Matches',
        your_trips: 'Your Trips',
        mamadb_protected: 'MamaDB Protected 🛡️',

        no_trips_found: 'No trips found in database.',
        reset_filters: 'Reset filters',

        pnrr_missions_title: 'PNRR Missions',
        pnrr_missions_desc: 'Actively contribute to your university\'s inclusion and sustainability goals.',
        learn_more: 'Learn more',

        passengers_on_board: 'Passengers on board',
        vehicle_type: 'Car',
        your_proposal: 'Your Proposal',
        booked: 'Booked',
        seat: 'seat',
        seats: 'seats',
        co2_saved_kg: 'kg CO2',
        mission_4_tutoring: 'Mission 4: {subject}',
        mission_5_inclusion: 'Mission 5: Inclusion',
        driver_label: 'Driver',
        me: 'You',
        book_now: 'Book now',
        cancel_unexpected: 'Cancel unexpected',
        cancel_commitment: 'Cancel commitment',

        filter_by_subject: 'Filter by study subject',
        all_subjects: 'All subjects',

        help_title: 'EcoShift Hub Guide',
        help_desc: 'EcoShift Hub is the Inclusive Smart Mobility platform dedicated to university students, funded within the PNRR initiatives.',
        pnrr_missions: 'Supported PNRR Missions',
        mission_3_title: 'Mission 3: Sustainable Mobility',
        mission_3_desc: 'We reduce environmental impact by sharing daily commutes to campus.',
        mission_4_title: 'Mission 4: Peer Tutoring',
        mission_4_desc: 'Make use of travel time to study together or receive support in specific subjects.',
        mission_5_title: 'Mission 5: Social Inclusion',
        mission_5_desc: 'We guarantee universal accessibility by offering specific support to those with special needs.',
        quick_guides: 'Quick Guides',
        earn_credits_guide: 'How to earn Eco-Credits',
        safety_trust_guide: 'Safety & Trust Protocol',
        inclusion_guide: 'Inclusive Assistance Guide',
        close_guide: 'Got it, thanks!',

        leaderboard_title: 'Eco-Warriors',
        top_5: 'Top 5',
        you_suffix: '(You)',
        level: 'Level',
        credits: 'Credits',

        eco_identity: 'Eco-Identity',
        mama_db_desc: 'Real-time data saved in MamaDB',
        base_info: 'Base Info',
        name_placeholder: 'Full Name',
        role_flexible: 'Flexible Mobility',
        role_driver_only: 'Driver Only',
        role_passenger_only: 'Passenger Only',
        expertise: 'Expertise (M4)',
        add_subject: 'Add a subject...',
        add_btn: 'ADD',
        accessibility_needs: 'Accessibility Needs (M5)',
        add_need: 'Add a need (e.g., Wheelchair)...',
        save_changes: 'Save Changes',
        manage_db: 'MamaDB Database Management',
        hide_data: 'Hide Data',
        export_json: 'Export JSON',
        reset_all: 'Total Reset',
        confirm_reset: 'Are you sure? All local data will be deleted.',

        propose_trip_header: 'Propose a Trip',
        propose_trip_subtitle: 'Help the community and earn Eco-Credits (+50💎)',
        route_details: 'Route Details (M3)',
        departure_point: 'Departure Point',
        destination_point: 'Destination',
        select_departure: 'Select departure...',
        select_destination: 'Select destination...',
        date_time: 'Date and Time',
        available_seats: 'Available Seats',
        peer_tutoring: 'Peer Tutoring (M4)',
        subject_optional: 'Subject (Optional)',
        social_inclusion: 'Social Inclusion (M5)',
        assist_special_needs: 'Offered assistance for special needs',
        publish_trip: 'Publish Trip 🚀',
        error_select_departure: 'Please select a departure point',
        error_select_destination: 'Please select a destination',
        error_select_datetime: 'Please select date and time',
        error_past_datetime: 'Date cannot be in the past',
        error_same_location: 'Departure and destination must be different',

        loading: 'Loading...',
        success: 'Success',
        error: 'Error',

        map_title: 'Milan Live Hub',
        map_subtitle: 'Sustainable Mobility',
        map_footer: 'EcoShift Interactive Intelligence',
        map_other: 'Other',
        vs_prefix: 'to',

        booking_success: 'Trip booked! +{credits}💎',
        booking_notification: '{name} booked {seats} {seatLabel} to {to}!',
        cancel_notification: '{name} cancelled the booking to {to}.',
        trip_cancelled_notification: 'The trip to {to} was cancelled by the driver.',
        unknown_destination: 'Unknown destination',
        participation_cancelled: 'Participation cancelled.',
        commitment_removed: 'Commitment removed.',

        footer_about: 'About',
        footer_privacy: 'Privacy',
        footer_terms: 'Terms',
        footer_contact: 'Contact',
        footer_pnrr: 'PNRR Project',
        footer_copyright: '© 2025 EcoShift Hub. All rights reserved.'
    },
    es: {
        app_name: 'EcoShift Hub',
        logout: 'Salir',
        home: 'Inicio',
        create: 'Crear',
        profile: 'Perfil',
        open_profile: 'Abrir Perfil',
        my_profile: 'Mi Perfil',
        create_trip_aria: 'Crear Viaje',

        login_tab: 'ACCEDER',
        register_tab: 'REGISTRARSE',
        full_name: 'Nombre Completo',
        uni_email: 'Email Universitario',
        password: 'Contraseña',
        default_role: 'Rol Predeterminado',
        role_both: 'Conductor y Pasajero',
        role_driver: 'Solo Conductor',
        role_passenger: 'Solo Pasajero',
        login_action: 'ENTRAR AL HUB',
        register_action: 'CREAR PERFIL ECO',
        auth_error_password: 'Contraseña incorrecta.',
        auth_error_not_found: 'Usuario no encontrado. ¡Regístrate para empezar!',
        auth_error_exists: 'Este correo ya está registrado.',
        auth_pnrr_contribution: 'Al participar contribuyes a',
        auth_pnrr_missions: 'Misiones PNRR 3, 4 y 5',
        auth_subtitle: 'Movilidad Universitaria Inclusiva',
        auth_verify_email_sent: 'Revisa tu correo: te hemos enviado un enlace para verificar tu dirección.',
        auth_verify_required: 'Verifica tu email antes de acceder. Revisa la bandeja (y spam) y haz clic en el enlace.',
        auth_resend_verification: 'Reenviar email de verificación',
        auth_forgot_password: '¿Olvidaste la contraseña?',
        auth_forgot_password_desc: 'Introduce el email con el que te registraste y te enviaremos un enlace para restablecer la contraseña.',
        auth_send_reset_link: 'Enviar enlace',
        auth_reset_password: 'Restablecer contraseña',
        auth_new_password: 'Nueva contraseña',
        auth_confirm_password: 'Confirmar contraseña',
        auth_reset_success: 'Contraseña actualizada. Ya puedes acceder.',
        auth_verify_success: '¡Email verificado! Ya puedes acceder.',
        auth_verify_expired: 'Enlace caducado. Pide un nuevo email de verificación.',
        auth_reset_expired: 'Enlace caducado. Pide un nuevo enlace para restablecer la contraseña.',
        auth_password_mismatch: 'Las dos contraseñas no coinciden.',

        eco_profile: 'Eco-Perfil',
        welcome_user: 'Hola {name}, ¿eres conductor o tutor hoy?',
        how_it_works: '❓ Cómo funciona',
        last_save: 'Último guardado: {time}',
        eco_credits: 'Eco-Créditos 💎',

        notifications: 'Notificaciones',
        no_news: 'Sin novedades.',

        explore_offers: 'Explorar Ofertas',
        my_commitments: 'Mis Compromisos',
        train_study: '🚆 Tren y Estudio',
        list_view: 'LISTA',
        map_view: 'MAPA',

        create_impact_title: 'Crear un nuevo impacto',
        create_impact_desc: 'Los datos se guardarán instantáneamente en MamaDB.',
        propose_trip_btn: 'Proponer Viaje +',

        search_placeholder: 'Buscar destino o materia...',
        support_m5: '♿ Soporte M5',
        match_available: 'Matches Disponibles',
        your_trips: 'Tus Viajes',
        mamadb_protected: 'MamaDB Protegido 🛡️',

        no_trips_found: 'No se encontraron viajes en la base de datos.',
        reset_filters: 'Restablecer filtros',

        pnrr_missions_title: 'Misiones PNRR',
        pnrr_missions_desc: 'Contribuye activamente a los objetivos de inclusión y sostenibilidad de tu universidad.',
        learn_more: 'Saber más',

        passengers_on_board: 'Pasajeros a bordo',
        vehicle_type: 'Auto',
        your_proposal: 'Tu Propuesta',
        booked: 'Reservado',
        seat: 'plaza',
        seats: 'plazas',
        co2_saved_kg: 'kg CO2',
        mission_4_tutoring: 'Misión 4: {subject}',
        mission_5_inclusion: 'Misión 5: Inclusión',
        driver_label: 'Conductor',
        me: 'Tú',
        book_now: 'Reservar ahora',
        cancel_unexpected: 'Cancelar imprevisto',
        cancel_commitment: 'Cancelar compromiso',

        filter_by_subject: 'Filtrar por materia de estudio',
        all_subjects: 'Todas las materias',

        help_title: 'Guía EcoShift Hub',
        help_desc: 'EcoShift Hub es la plataforma de Movilidad Inteligente Inclusiva dedicada a estudiantes universitarios, financiada bajo las iniciativas PNRR.',
        pnrr_missions: 'Misiones PNRR Soportadas',
        mission_3_title: 'Misión 3: Movilidad Sostenible',
        mission_3_desc: 'Reducimos el impacto ambiental compartiendo los trayectos diarios al campus.',
        mission_4_title: 'Misión 4: Tutoría entre pares',
        mission_4_desc: 'Aprovecha el tiempo de viaje para estudiar juntos o recibir apoyo en materias específicas.',
        mission_5_title: 'Misión 5: Inclusión Social',
        mission_5_desc: 'Garantizamos la accesibilidad universal ofreciendo apoyo específico a quienes tienen necesidades especiales.',
        quick_guides: 'Guías Rápidas',
        earn_credits_guide: 'Cómo ganar Eco-Créditos',
        safety_trust_guide: 'Protocolo de Seguridad y Confianza',
        inclusion_guide: 'Guía de Asistencia Inclusiva',
        close_guide: '¡Entendido, gracias!',

        leaderboard_title: 'Guerreros Eco',
        top_5: 'Top 5',
        you_suffix: '(Tú)',
        level: 'Nivel',
        credits: 'Créditos',

        eco_identity: 'Eco-Identidad',
        mama_db_desc: 'Datos guardados en tiempo real en MamaDB',
        base_info: 'Información Básica',
        name_placeholder: 'Nombre y Apellidos',
        role_flexible: 'Movilidad Flexible',
        role_driver_only: 'Solo Conductor',
        role_passenger_only: 'Solo Pasajero',
        expertise: 'Experiencia (M4)',
        add_subject: 'Añadir una materia...',
        add_btn: 'ADD',
        accessibility_needs: 'Necesidades de accesibilidad (M5)',
        add_need: 'Añadir necesidad (ej. silla de ruedas)...',
        save_changes: 'Guardar Cambios',
        manage_db: 'Gestión de la base de datos MamaDB',
        hide_data: 'Ocultar Datos',
        export_json: 'Exportar JSON',
        reset_all: 'Reinicio Total',
        confirm_reset: '¿Estás seguro? Todos los datos locales se eliminarán.',

        propose_trip_header: 'Proponer un Viaje',
        propose_trip_subtitle: 'Ayuda a la comunidad y gana Eco-Créditos (+50💎)',
        route_details: 'Detalles de la Ruta (M3)',
        departure_point: 'Punto de Partida',
        destination_point: 'Destino',
        select_departure: 'Seleccionar salida...',
        select_destination: 'Seleccionar destino...',
        date_time: 'Fecha y Hora',
        available_seats: 'Plazas Disponibles',
        peer_tutoring: 'Tutoría entre pares (M4)',
        subject_optional: 'Materia (Opcional)',
        social_inclusion: 'Inclusión Social (M5)',
        assist_special_needs: 'Ofrezco asistencia para necesidades especiales',
        publish_trip: 'Publicar Viaje 🚀',
        error_select_departure: 'Selecciona un punto de partida',
        error_select_destination: 'Selecciona un destino',
        error_select_datetime: 'Selecciona fecha y hora',
        error_past_datetime: 'La fecha no puede ser en el pasado',
        error_same_location: 'La salida y el destino deben ser diferentes',

        loading: 'Cargando...',
        success: 'Éxito',
        error: 'Error',

        map_title: 'Milan Live Hub',
        map_subtitle: 'Movilidad Sostenible',
        map_footer: 'EcoShift Interactive Intelligence',
        map_other: 'Otro',
        vs_prefix: 'hacia',

        booking_success: '¡Viaje reservado! +{credits}💎',
        booking_notification: '¡{name} reservó {seats} {seatLabel} para {to}!',
        cancel_notification: '{name} canceló la reserva para {to}.',
        trip_cancelled_notification: 'El viaje para {to} fue cancelado por el conductor.',
        unknown_destination: 'Destino desconocido',
        participation_cancelled: 'Participación cancelada.',
        commitment_removed: 'Compromiso eliminado.',

        footer_about: 'Quiénes somos',
        footer_privacy: 'Privacidad',
        footer_terms: 'Términos',
        footer_contact: 'Contacto',
        footer_pnrr: 'Proyecto PNRR',
        footer_copyright: '© 2025 EcoShift Hub. Todos los derechos reservados.'
    },
    fr: {
        app_name: 'EcoShift Hub',
        logout: 'Quitter',
        home: 'Accueil',
        create: 'Créer',
        profile: 'Profil',
        open_profile: 'Ouvrir Profil',
        my_profile: 'Mon Profil',
        create_trip_aria: 'Créer Trajet',

        login_tab: 'CONNEXION',
        register_tab: 'S\'INSCRIRE',
        full_name: 'Nom Complet',
        uni_email: 'Email Universitaire',
        password: 'Mot de passe',
        default_role: 'Rôle par défaut',
        role_both: 'Conducteur & Passager',
        role_driver: 'Conducteur Seulement',
        role_passenger: 'Passager Seulement',
        login_action: 'ENTRER DANS LE HUB',
        register_action: 'CRÉER PROFIL ECO',
        auth_error_password: 'Mot de passe incorrect.',
        auth_error_not_found: 'Utilisateur non trouvé. Inscrivez-vous pour commencer !',
        auth_error_exists: 'Cet email est déjà enregistré.',
        auth_pnrr_contribution: 'En participant, vous contribuez aux',
        auth_pnrr_missions: 'Missions PNRR 3, 4 et 5',
        auth_subtitle: 'Mobilité Universitaire Inclusive',
        auth_verify_email_sent: 'Vérifie ton email : nous t\'avons envoyé un lien pour vérifier ton adresse.',
        auth_verify_required: 'Vérifie ton email avant de te connecter. Vérifie ta boîte (et les spams) et clique sur le lien.',
        auth_resend_verification: 'Renvoyer l\'email de vérification',
        auth_forgot_password: 'Mot de passe oublié ?',
        auth_forgot_password_desc: 'Entre l\'email avec lequel tu t\'es inscrit : nous t\'enverrons un lien pour réinitialiser le mot de passe.',
        auth_send_reset_link: 'Envoyer le lien',
        auth_reset_password: 'Réinitialiser le mot de passe',
        auth_new_password: 'Nouveau mot de passe',
        auth_confirm_password: 'Confirmer le mot de passe',
        auth_reset_success: 'Mot de passe mis à jour. Tu peux maintenant te connecter.',
        auth_verify_success: 'Email vérifié ! Tu peux maintenant te connecter.',
        auth_verify_expired: 'Lien expiré. Demande un nouvel email de vérification.',
        auth_reset_expired: 'Lien expiré. Demande un nouveau lien pour réinitialiser le mot de passe.',
        auth_password_mismatch: 'Les deux mots de passe ne correspondent pas.',

        eco_profile: 'Eco-Profil',
        welcome_user: 'Salut {name}, es-tu conducteur ou tuteur aujourd\'hui ?',
        how_it_works: '❓ Comment ça marche',
        last_save: 'Dernière sauvegarde : {time}',
        eco_credits: 'Eco-Crédit 💎',

        notifications: 'Notifications',
        no_news: 'Aucune nouveauté.',

        explore_offers: 'Explorer Offres',
        my_commitments: 'Mes Engagements',
        train_study: '🚆 Train & Étude',
        list_view: 'LISTE',
        map_view: 'CARTE',

        create_impact_title: 'Créer un nouvel impact',
        create_impact_desc: 'Les données seront enregistrées instantanément dans MamaDB.',
        propose_trip_btn: 'Proposer Trajet +',

        search_placeholder: 'Rechercher destination ou matière...',
        support_m5: '♿ Support M5',
        match_available: 'Correspondances Disponibles',
        your_trips: 'Vos Trajets',
        mamadb_protected: 'MamaDB Protégé 🛡️',

        no_trips_found: 'Aucun trajet trouvé dans la base de données.',
        reset_filters: 'Réinitialiser filtres',

        pnrr_missions_title: 'Missions PNRR',
        pnrr_missions_desc: 'Contribuez activement aux objectifs d\'inclusion et de durabilité de votre université.',
        learn_more: 'En savoir plus',

        passengers_on_board: 'Passagers à bord',
        vehicle_type: 'Voiture',
        your_proposal: 'Votre Proposition',
        booked: 'Réserver',
        seat: 'siège',
        seats: 'sièges',
        co2_saved_kg: 'kg CO2',
        mission_4_tutoring: 'Mission 4 : {subject}',
        mission_5_inclusion: 'Mission 5 : Inclusion',
        driver_label: 'Conducteur',
        me: 'Vous',
        book_now: 'Réserver maintenant',
        cancel_unexpected: 'Annuler imprévu',
        cancel_commitment: 'Annuler engagement',

        filter_by_subject: 'Filtrer par sujet d\'étude',
        all_subjects: 'Toutes les matières',

        help_title: 'Guide EcoShift Hub',
        help_desc: 'EcoShift Hub est la plateforme de Mobilité Intelligente Inclusive dédiée aux étudiants universitaires, financée dans le cadre des initiatives PNRR.',
        pnrr_missions: 'Missions PNRR Supportées',
        mission_3_title: 'Mission 3 : Mobilité Durable',
        mission_3_desc: 'Nous réduisons l\'impact environnemental en partageant les trajets quotidiens vers le campus.',
        mission_4_title: 'Mission 4 : Tutorat par les pairs',
        mission_4_desc: 'Profitez du temps de trajet pour étudier ensemble ou recevoir du soutien dans des matières spécifiques.',
        mission_5_title: 'Mission 5 : Inclusion Sociale',
        mission_5_desc: 'Nous garantissons une accessibilité universelle en offrant un soutien spécifique aux personnes ayant des besoins particuliers.',
        quick_guides: 'Guides Rapides',
        earn_credits_guide: 'Comment gagner des Eco-Crédits',
        safety_trust_guide: 'Protocole Sécurité & Confiance',
        inclusion_guide: 'Guide d\'Assistance Inclusive',
        close_guide: 'C\'est compris, merci !',

        leaderboard_title: 'Eco-Guerriers',
        top_5: 'Top 5',
        you_suffix: '(Vous)',
        level: 'Niveau',
        credits: 'Crédits',

        eco_identity: 'Eco-Identité',
        mama_db_desc: 'Données sauvegardées en temps réel dans MamaDB',
        base_info: 'Informations de Base',
        name_placeholder: 'Nom et Prénom',
        role_flexible: 'Mobilité Flexible',
        role_driver_only: 'Conducteur Uniquement',
        role_passenger_only: 'Passager Uniquement',
        expertise: 'Expertise (M4)',
        add_subject: 'Ajouter une matière...',
        add_btn: 'ADD',
        accessibility_needs: 'Besoins d\'accessibilité (M5)',
        add_need: 'Ajouter un besoin (ex. fauteuil roulant)...',
        save_changes: 'Sauvegarder Changements',
        manage_db: 'Gestion de la base de données MamaDB',
        hide_data: 'Masquer les Données',
        export_json: 'Exporter JSON',
        reset_all: 'Réinitialisation Totale',
        confirm_reset: 'Êtes-vous sûr ? Toutes les données locales seront supprimées.',

        propose_trip_header: 'Proposer un Trajet',
        propose_trip_subtitle: 'Aidez la communauté et gagnez des Eco-Crédits (+50💎)',
        route_details: 'Détails de l\'Itinéraire (M3)',
        departure_point: 'Point de Départ',
        destination_point: 'Destination',
        select_departure: 'Sélectionner le départ...',
        select_destination: 'Sélectionner la destination...',
        date_time: 'Date et Heure',
        available_seats: 'Sièges Disponibles',
        peer_tutoring: 'Tutorat par les pairs (M4)',
        subject_optional: 'Matière (Optionnel)',
        social_inclusion: 'Inclusion Sociale (M5)',
        assist_special_needs: 'J\'offre de l\'aide pour les besoins spéciaux',
        publish_trip: 'Publier Trajet 🚀',
        error_select_departure: 'Veuillez sélectionner un point de départ',
        error_select_destination: 'Veuillez sélectionner une destination',
        error_select_datetime: 'Veuillez sélectionner une date et heure',
        error_past_datetime: 'La date ne peut pas être dans le passé',
        error_same_location: 'Le départ et la destination doivent être différents',

        loading: 'Chargement...',
        success: 'Succès',
        error: 'Erreur',

        map_title: 'Milan Live Hub',
        map_subtitle: 'Mobilité Durable',
        map_footer: 'EcoShift Interactive Intelligence',
        map_other: 'Autre',
        vs_prefix: 'vers',

        booking_success: 'Trajet réservé ! +{credits}💎',
        booking_notification: '{name} a réservé {seats} {seatLabel} pour {to} !',
        cancel_notification: '{name} a annulé la réservation pour {to}.',
        trip_cancelled_notification: 'Le trajet pour {to} a été annulé par le conducteur.',
        unknown_destination: 'Destination inconnue',
        participation_cancelled: 'Participation annulée.',
        commitment_removed: 'Engagement supprimé.',

        footer_about: 'À propos',
        footer_privacy: 'Confidentialité',
        footer_terms: 'Conditions',
        footer_contact: 'Contact',
        footer_pnrr: 'Projet PNRR',
        footer_copyright: '© 2025 EcoShift Hub. Tous droits réservés.'
    },
    de: {
        app_name: 'EcoShift Hub',
        logout: 'Abmelden',
        home: 'Home',
        create: 'Erstellen',
        profile: 'Profil',
        open_profile: 'Profil öffnen',
        my_profile: 'Mein Profil',
        create_trip_aria: 'Fahrt erstellen',

        login_tab: 'ANMELDEN',
        register_tab: 'REGISTRIEREN',
        full_name: 'Vollständiger Name',
        uni_email: 'Uni-E-Mail',
        password: 'Passwort',
        default_role: 'Standardrolle',
        role_both: 'Fahrer & Passagier',
        role_driver: 'Nur Fahrer',
        role_passenger: 'Nur Passagier',
        login_action: 'HUB BETRETEN',
        register_action: 'ECO-PROFIL ERSTELLEN',
        auth_error_password: 'Falsches Passwort.',
        auth_error_not_found: 'Benutzer nicht gefunden. Bitte registrieren!',
        auth_error_exists: 'Diese E-Mail ist bereits registriert.',
        auth_pnrr_contribution: 'Durch Ihre Teilnahme tragen Sie bei zu',
        auth_pnrr_missions: 'PNRR Missionen 3, 4 und 5',
        auth_subtitle: 'Inklusive Universitätsmobilität',
        auth_verify_email_sent: 'Überprüfe deine E-Mail: Wir haben dir einen Link zur Bestätigung geschickt.',
        auth_verify_required: 'Bitte bestätige deine E-Mail vor dem Login. Prüfe Posteingang (und Spam) und klicke auf den Link.',
        auth_resend_verification: 'Bestätigungs-E-Mail erneut senden',
        auth_forgot_password: 'Passwort vergessen?',
        auth_forgot_password_desc: 'Gib die E-Mail ein, mit der du dich registriert hast: Wir senden dir einen Link zum Zurücksetzen.',
        auth_send_reset_link: 'Link senden',
        auth_reset_password: 'Passwort zurücksetzen',
        auth_new_password: 'Neues Passwort',
        auth_confirm_password: 'Passwort bestätigen',
        auth_reset_success: 'Passwort aktualisiert. Du kannst dich jetzt anmelden.',
        auth_verify_success: 'E-Mail bestätigt! Du kannst dich jetzt anmelden.',
        auth_verify_expired: 'Link abgelaufen. Fordere eine neue Bestätigungs-E-Mail an.',
        auth_reset_expired: 'Link abgelaufen. Fordere einen neuen Link zum Zurücksetzen an.',
        auth_password_mismatch: 'Die beiden Passwörter stimmen nicht überein.',

        eco_profile: 'Eco-Profil',
        welcome_user: 'Hallo {name}, bist du heute Fahrer oder Tutor?',
        how_it_works: '❓ Wie es funktioniert',
        last_save: 'Zuletzt gespeichert: {time}',
        eco_credits: 'Eco-Credits 💎',

        notifications: 'Benachrichtigungen',
        no_news: 'Keine Neuigkeiten.',

        explore_offers: 'Angebote entdecken',
        my_commitments: 'Meine Verpflichtungen',
        train_study: '🚆 Zug & Studium',
        list_view: 'LISTE',
        map_view: 'KARTE',

        create_impact_title: 'Neuen Impact erstellen',
        create_impact_desc: 'Daten werden sofort in der MamaDB gespeichert.',
        propose_trip_btn: 'Fahrt vorschlagen +',

        search_placeholder: 'Ziel oder Fach suchen...',
        support_m5: '♿ M5 Unterstützung',
        match_available: 'Verfügbare Matches',
        your_trips: 'Deine Fahrten',
        mamadb_protected: 'MamaDB Geschützt 🛡️',

        no_trips_found: 'Keine Fahrten in der Datenbank gefunden.',
        reset_filters: 'Filter zurücksetzen',

        pnrr_missions_title: 'PNRR Missionen',
        pnrr_missions_desc: 'Tragen Sie aktiv zu den Inklusions- und Nachhaltigkeitszielen Ihrer Universität bei.',
        learn_more: 'Mehr erfahren',

        passengers_on_board: 'Fahrgäste an Bord',
        vehicle_type: 'Auto',
        your_proposal: 'Dein Vorschlag',
        booked: 'Gebucht',
        seat: 'Platz',
        seats: 'Plätze',
        co2_saved_kg: 'kg CO2',
        mission_4_tutoring: 'Mission 4: {subject}',
        mission_5_inclusion: 'Mission 5: Inklusion',
        driver_label: 'Fahrer',
        me: 'Du',
        book_now: 'Jetzt buchen',
        cancel_unexpected: 'Unerwartetes stornieren',
        cancel_commitment: 'Zusage stornieren',

        filter_by_subject: 'Nach Studienfach filtern',
        all_subjects: 'Alle Fächer',

        help_title: 'EcoShift Hub Leitfaden',
        help_desc: 'EcoShift Hub ist die Plattform für inklusive intelligente Mobilität für Universitätsstudierende, die im Rahmen der PNRR-Initiativen finanziert wird.',
        pnrr_missions: 'Unterstützte PNRR-Missionen',
        mission_3_title: 'Mission 3: Nachhaltige Mobilität',
        mission_3_desc: 'Wir reduzieren die Umweltbelastung, indem wir tägliche Fahrten zum Campus teilen.',
        mission_4_title: 'Mission 4: Peer Tutoring',
        mission_4_desc: 'Nutzen Sie die Reisezeit, um gemeinsam zu lernen oder Unterstützung in bestimmten Fächern zu erhalten.',
        mission_5_title: 'Mission 5: Soziale Inklusion',
        mission_5_desc: 'Wir garantieren universelle Zugänglichkeit, indem wir Menschen mit besonderen Bedürfnissen gezielt unterstützen.',
        quick_guides: 'Kurzanleitungen',
        earn_credits_guide: 'Wie man Eco-Credits verdient',
        safety_trust_guide: 'Sicherheits- & Vertrauensprotokoll',
        inclusion_guide: 'Leitfaden für inklusive Unterstützung',
        close_guide: 'Verstanden, danke!',

        leaderboard_title: 'Eco-Krieger',
        top_5: 'Top 5',
        you_suffix: '(Du)',
        level: 'Stufe',
        credits: 'Credits',

        eco_identity: 'Eco-Identität',
        mama_db_desc: 'Echtzeitdaten in MamaDB gespeichert',
        base_info: 'Basisinfo',
        name_placeholder: 'Vor- und Nachname',
        role_flexible: 'Flexible Mobilität',
        role_driver_only: 'Nur Fahrer',
        role_passenger_only: 'Nur Passagier',
        expertise: 'Expertise (M4)',
        add_subject: 'Fach hinzufügen...',
        add_btn: 'ADD',
        accessibility_needs: 'Barrierefreiheit (M5)',
        add_need: 'Bedürfnis hinzufügen (z. B. Rollstuhl)...',
        save_changes: 'Änderungen speichern',
        manage_db: 'MamaDB Datenbankverwaltung',
        hide_data: 'Daten ausblenden',
        export_json: 'JSON exportieren',
        reset_all: 'Total-Reset',
        confirm_reset: 'Sind Sie sicher? Alle lokalen Daten werden gelöscht.',

        propose_trip_header: 'Fahrt vorschlagen',
        propose_trip_subtitle: 'Helfen Sie der Community und verdienen Sie Eco-Credits (+50💎)',
        route_details: 'Routendetails (M3)',
        departure_point: 'Abfahrtsort',
        destination_point: 'Zielort',
        select_departure: 'Abfahrt auswählen...',
        select_destination: 'Ziel auswählen...',
        date_time: 'Datum und Uhrzeit',
        available_seats: 'Verfügbare Plätze',
        peer_tutoring: 'Peer Tutoring (M4)',
        subject_optional: 'Fach (Optional)',
        social_inclusion: 'Soziale Inklusion (M5)',
        assist_special_needs: 'Ich biete Unterstützung bei besonderen Bedürfnissen an',
        publish_trip: 'Fahrt veröffentlichen 🚀',
        error_select_departure: 'Bitte wählen Sie einen Abfahrtsort',
        error_select_destination: 'Bitte wählen Sie ein Ziel',
        error_select_datetime: 'Bitte wählen Sie Datum und Uhrzeit',
        error_past_datetime: 'Das Datum kann nicht in der Vergangenheit liegen',
        error_same_location: 'Abfahrt und Ziel müssen unterschiedlich sein',

        loading: 'Laden...',
        success: 'Erfolgreich',
        error: 'Fehler',

        map_title: 'Mailand Live Hub',
        map_subtitle: 'Nachhaltige Mobilität',
        map_footer: 'EcoShift Interactive Intelligence',
        map_other: 'Andere',
        vs_prefix: 'nach',

        booking_success: 'Fahrt gebucht! +{credits}💎',
        booking_notification: '{name} hat {seats} {seatLabel} nach {to} gebucht!',
        cancel_notification: '{name} hat die Buchung nach {to} storniert.',
        trip_cancelled_notification: 'Die Fahrt nach {to} wurde vom Fahrer storniert.',
        unknown_destination: 'Unbekanntes Ziel',
        participation_cancelled: 'Teilnahme storniert.',
        commitment_removed: 'Zusage entfernt.',

        footer_about: 'Über uns',
        footer_privacy: 'Datenschutz',
        footer_terms: 'AGB',
        footer_contact: 'Kontakt',
        footer_pnrr: 'PNRR Projekt',
        footer_copyright: '© 2025 EcoShift Hub. Alle Rechte vorbehalten.'
    },
    nl: {
        app_name: 'EcoShift Hub',
        logout: 'Uitloggen',
        home: 'Home',
        create: 'Maken',
        profile: 'Profiel',
        open_profile: 'Profiel openen',
        my_profile: 'Mijn Profiel',
        create_trip_aria: 'Reis Maken',

        login_tab: 'INLOGGEN',
        register_tab: 'REGISTREREN',
        full_name: 'Volledige Naam',
        uni_email: 'Universiteits E-mail',
        password: 'Wachtwoord',
        default_role: 'Standaard Rol',
        role_both: 'Bestuurder & Passagier',
        role_driver: 'Alleen Bestuurder',
        role_passenger: 'Alleen Passagier',
        login_action: 'HUB BETREDEN',
        register_action: 'ECO PROFIEL MAKEN',
        auth_error_password: 'Onjuist wachtwoord.',
        auth_error_not_found: 'Gebruiker niet gevonden. Registreer om te beginnen!',
        auth_error_exists: 'Dit e-mailadres is al geregistreerd.',
        auth_pnrr_contribution: 'Door deel te nemen draag je bij aan',
        auth_pnrr_missions: 'PNRR Missies 3, 4 en 5',
        auth_subtitle: 'Inclusieve Universitaire Mobiliteit',
        auth_verify_email_sent: 'Controleer je e-mail: we hebben je een link gestuurd om je adres te verifiëren.',
        auth_verify_required: 'Verifieer je e-mail voordat je inlogt. Controleer je inbox (en spam) en klik op de link.',
        auth_resend_verification: 'Verificatie-e-mail opnieuw versturen',
        auth_forgot_password: 'Wachtwoord vergeten?',
        auth_forgot_password_desc: 'Voer het e-mailadres in waarmee je je hebt geregistreerd: we sturen je een link om je wachtwoord te resetten.',
        auth_send_reset_link: 'Link versturen',
        auth_reset_password: 'Wachtwoord resetten',
        auth_new_password: 'Nieuw wachtwoord',
        auth_confirm_password: 'Bevestig wachtwoord',
        auth_reset_success: 'Wachtwoord bijgewerkt. Je kunt nu inloggen.',
        auth_verify_success: 'E-mail geverifieerd! Je kunt nu inloggen.',
        auth_verify_expired: 'Link verlopen. Vraag een nieuwe verificatie-e-mail aan.',
        auth_reset_expired: 'Link verlopen. Vraag een nieuwe resetlink aan.',
        auth_password_mismatch: 'De twee wachtwoorden komen niet overeen.',

        eco_profile: 'Eco-Profiel',
        welcome_user: 'Hoi {name}, ben je vandaag bestuurder of tutor?',
        how_it_works: '❓ Hoe het werkt',
        last_save: 'Laatst opgeslagen: {time}',
        eco_credits: 'Eco-Credits 💎',

        notifications: 'Meldingen',
        no_news: 'Geen nieuws.',

        explore_offers: 'Aanbiedingen verkennen',
        my_commitments: 'Mijn Verplichtingen',
        train_study: '🚆 Trein & Studie',
        list_view: 'LIJST',
        map_view: 'KAART',

        create_impact_title: 'Nieuwe impact creëren',
        create_impact_desc: 'Gegevens worden direct opgeslagen in de MamaDB.',
        propose_trip_btn: 'Reis Voorstellen +',

        search_placeholder: 'Zoek bestemming of vak...',
        support_m5: '♿ M5 Ondersteuning',
        match_available: 'Beschikbare Matches',
        your_trips: 'Jouw Reizen',
        mamadb_protected: 'MamaDB Beveiligd 🛡️',

        no_trips_found: 'Geen reizen gevonden in de database.',
        reset_filters: 'Filters resetten',

        pnrr_missions_title: 'PNRR Missies',
        pnrr_missions_desc: 'Draag actief bij aan de inclusie- en duurzaamheidsdoelen van je universiteit.',
        learn_more: 'Meer weten',

        passengers_on_board: 'Passagiers aan boord',
        vehicle_type: 'Auto',
        your_proposal: 'Jouw Voorstel',
        booked: 'Geboekt',
        seat: 'plaats',
        seats: 'plaatsen',
        co2_saved_kg: 'kg CO2',
        mission_4_tutoring: 'Missie 4: {subject}',
        mission_5_inclusion: 'Missie 5: Inclusie',
        driver_label: 'Bestuurder',
        me: 'Jij',
        book_now: 'Nu boeken',
        cancel_unexpected: 'Onverwachte annulering',
        cancel_commitment: 'Toezegging annuleren',

        filter_by_subject: 'Filteren op studievak',
        all_subjects: 'Alle vakken',

        help_title: 'EcoShift Hub Gids',
        help_desc: 'EcoShift Hub is het platform voor Inclusive Smart Mobility voor universiteitsstudenten, gefinancierd binnen de PNRR-initiatieven.',
        pnrr_missions: 'Ondersteunde PNRR Missies',
        mission_3_title: 'Missie 3: Duurzame Mobiliteit',
        mission_3_desc: 'We verminderen de milieu-impact door dagelijkse ritten naar de campus te delen.',
        mission_4_title: 'Missie 4: Peer Tutoring',
        mission_4_desc: 'Gebruik de reistijd om samen te studeren of ondersteuning te krijgen in specifieke vakken.',
        mission_5_title: 'Missie 5: Sociale Inclusie',
        mission_5_desc: 'Wij garanderen universele toegankelijkheid door specifieke ondersteuning te bieden aan mensen met speciale behoeften.',
        quick_guides: 'Snelle Gidsen',
        earn_credits_guide: 'Hoe Eco-Credits te verdienen',
        safety_trust_guide: 'Veiligheids- & Vertrouwensprotocol',
        inclusion_guide: 'Gids voor Inclusieve Assistentie',
        close_guide: 'Begrepen, bedankt!',

        leaderboard_title: 'Eco-Strijders',
        top_5: 'Top 5',
        you_suffix: '(Jij)',
        level: 'Niveau',
        credits: 'Credits',

        eco_identity: 'Eco-Identiteit',
        mama_db_desc: 'Real-time gegevens opgeslagen in MamaDB',
        base_info: 'Basis Info',
        name_placeholder: 'Voor- en Achternaam',
        role_flexible: 'Flexibele Mobiliteit',
        role_driver_only: 'Alleen Bestuurder',
        role_passenger_only: 'Alleen Passagier',
        expertise: 'Expertise (M4)',
        add_subject: 'Studievak toevoegen...',
        add_btn: 'ADD',
        accessibility_needs: 'Toegankelijkheidsbehoeften (M5)',
        add_need: 'Behoefte toevoegen (bijv. rolstoel)...',
        save_changes: 'Wijzigingen Opslaan',
        manage_db: 'MamaDB Database Beheer',
        hide_data: 'Gegevens Verbergen',
        export_json: 'JSON Exporteren',
        reset_all: 'Totale Reset',
        confirm_reset: 'Weet je het zeker? Alle lokale gegevens worden verwijderd.',

        propose_trip_header: 'Reis Voorstellen',
        propose_trip_subtitle: 'Help de community en verdien Eco-Credits (+50💎)',
        route_details: 'Route Details (M3)',
        departure_point: 'Vertrekpunt',
        destination_point: 'Bestemming',
        select_departure: 'Selecteer vertrek...',
        select_destination: 'Selecteer bestemming...',
        date_time: 'Datum en Tijd',
        available_seats: 'Beschikbare Plaatsen',
        peer_tutoring: 'Peer Tutoring (M4)',
        subject_optional: 'Studievak (Optioneel)',
        social_inclusion: 'Sociale Inclusie (M5)',
        assist_special_needs: 'Ik bied hulp bij speciale behoeften',
        publish_trip: 'Reis Publiceren 🚀',
        error_select_departure: 'Selecteer een vertrekpunt',
        error_select_destination: 'Selecteer een bestemming',
        error_select_datetime: 'Selecteer datum en tijd',
        error_past_datetime: 'Datum kan niet in het verleden liggen',
        error_same_location: 'Vertrek en bestemming moeten verschillend zijn',

        loading: 'Laden...',
        success: 'Succes',
        error: 'Fout',

        map_title: 'Milaan Live Hub',
        map_subtitle: 'Duurzame Mobiliteit',
        map_footer: 'EcoShift Interactive Intelligence',
        map_other: 'Andere',
        vs_prefix: 'naar',

        booking_success: 'Reis geboekt! +{credits}💎',
        booking_notification: '{name} heeft {seats} {seatLabel} naar {to} geboekt!',
        cancel_notification: '{name} heeft de boeking naar {to} geannuleerd.',
        trip_cancelled_notification: 'De reis naar {to} is geannuleerd door de chauffeur.',
        unknown_destination: 'Onbekende bestemming',
        participation_cancelled: 'Deelname geannuleerd.',
        commitment_removed: 'Verbintenis verwijderd.',

        footer_about: 'Over ons',
        footer_privacy: 'Privacy',
        footer_terms: 'Voorwaarden',
        footer_contact: 'Contact',
        footer_pnrr: 'PNRR Project',
        footer_copyright: '© 2025 EcoShift Hub. Alle rechten voorbehouden.'
    }
};

// --- Context ---
interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('it');

    const value = {
        language,
        setLanguage,
        t: translations[language]
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
