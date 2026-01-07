import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

// 1. Define your translations here
const translations = {
  en: {
    // Login
    login: "Log in",
    signup: "Sign up",
    welcome: "Welcome Back",
    welcomeSub: "Sign in to continue your Dream Trip",
    email: "Your Email",
    password: "Password",
    forgotPass: "Forgot password?",
    loginBtn: "Log In",
    noAccount: "Don't have an account?",
    
    // Register
    fullName: "Full Name",
    username: "User Name",
    dob: "Date of Birth",
    phone: "Phone Number",
    roleQuestion: "Are you a traveller/ travel agency?",
    traveller: "Traveller",
    agency: "Travel Agency",
    continue: "Continue",
    haveAccount: "Already have an account?",
    placeholderName: "e.g. Shane Lee",
    placeholderUsername: "e.g. SuperTravel",
    placeholderEmail: "contact@email.com",
    placeholderDob: "DD/MM/YYYY",
    placeholderPhone: "e.g. 0123456789",
    emailReadOnly: "Email (Read-only)",
    notSet: "Not set",

    // Alerts & Errors
    alertFillFields: "Please fill in all required fields.",
    alertPassShort: "Password is too short.\nIt must be at least 6 characters.",
    alertPhoneInvalid: "Please enter a valid Malaysian phone (e.g., 011xxxxxxxx).",
    alertAccountCreated: "Account Created!",
    alertPermissionTitle: "Permission Required",
    alertPermissionMsg: "Allow access to photos to change your profile picture.",
    alertRequiredTitle: "Required",
    alertRequiredMsg: "Please enter your Name and Phone.",
    alertSuccessTitle: "Success",
    alertProfileUpdated: "Profile updated!",
    alertErrorTitle: "Error",
    alertUpdateFail: "Could not update profile.",
    
    // Profile
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    save: "Save",
    cancel: "Cancel",
    changePhoto: "Tap to change",
    
    // Settings
    account: "ACCOUNT",
    changePass: "Change Password",
    support: "SUPPORT & INFO",
    clearCache: "Clear Cache",
    terms: "Terms of Service",
    about: "About App",
    language: "Language",
    switchLang: "Bahasa Melayu", // Label for the switch

    // Home Page & Sidebar
    hi: "Hi,",
    sectionEnt: "Recommended Entertainment",
    emptyEnt: "No entertainment found.",
    sectionFood: "Food you should try",
    emptyFood: "No food spots found.",
    sectionPlan: "Recommended Plan",
    emptyPlan: "No plans available at the moment.",
    
    // Plan Card
    rating: "Rating",
    estimated: "Estimated:",
    
    // Sidebar Menu
    menuOrders: "Orders",
    menuFav: "Favourites",
    menuSettings: "Settings",
    menuHelp: "Help & Support",
    alertSupport: "Support coming soon",
    logout: "Log Out",
    alertLogoutFail: "Failed to log out",

    // Details Screen (Entertainment & Food)
    peerRating: "Peer Rating",
    about: "About",
    costBreakdown: "Cost Breakdown",
    ticket: "Ticket",
    transport: "Transport",
    locationPreview: "Location Preview",
    noMap: "No location map available",
    go: "Go",
    totalExpenses: "Total Expenses",
    addToPlan: "Add to Plan",
    
    // Plan Modal
    newTripName: "New Trip Name",
    selectTrip: "Select a Trip",
    itemsCount: "items",
    noActivePlans: "No active plans.",
    createNewPlan: "Create New Plan",
    placeholderPlanName: "e.g. Penang Food Hunt",
    back: "Back",
    createAndAdd: "Create & Add",

    // Alerts
    alertNoLocation: "No Location",
    alertNoLocationMsg: "No location link provided.",
    alertFetchPlanFail: "Could not fetch your plans.",
    alertTripNameReq: "Please enter a trip name.",
    alertCreateFail: "Failed to create plan.",
    alertAddedTo: "Added to", // Will be used as "Added to [Plan Name]"
    alertAddToPlanFail: "Could not add to plan.",

    // Food Details
    foodieRating: "Foodie Rating",
    aboutSpot: "About this Spot",
    estimatedCosts: "Estimated Costs",
    priceRange: "Price Range",
    estimatedTotal: "Estimated Total",

    // Explore Screen
    explore: "Explore",
    findAdventure: "Find your next adventure",
    searchEnt: "Search Entertainment...",
    searchFood: "Search Food...",
    popularAttractions: "Popular Attractions",
    localDelicacies: "Local Delicacies",
    found: "found",
    noResults: "No results found.",
    noDesc: "No description available.",

    // Plan Details Screen
    tripDetails: "Trip Details",
    noSchedule: "No schedule available.",
    customizeTrip: "Customize your Trip",
    from: "From:",
    to: "To:",
    noOfPax: "No of Pax:",
    travelAgencyLabel: "Travel Agency:",
    selectAgencyPlaceholder: "Select Agency...",
    estimatedExpenses: "Estimated Expenses",
    total: "Total",
    addToCart: "Add to Cart",
    
    // Default Schedule Items & Fees
    ticketEntry: "Ticket / Entry Fee",
    transportFee: "Transport Fee",
    packageFee: "Package Fee",
    estimatedCost: "Estimated Cost",
    lunchBreak: "Lunch Break",
    freeEasy: "Free & Easy",
    restTime: "Rest Time",
    activity: "Activity",

    // Chart Legend
    legendFood: "Food",
    legendEnt: "Entertainment",
    legendHotel: "Hotel",
    legendTransport: "Transport",

    // Agency Modal
    selectAgencyTitle: "Select Agency",
    noAgencies: "No agencies found.",
    close: "Close",

    // Alerts
    alertNoPlanSelected: "No plan selected.",
    alertPlanNotFound: "Plan not found.",
    alertLoadFail: "Could not load plan details.",
    alertLoginCart: "You must be logged in to add items to cart.",
    alertSelectAgency: "Please select a Travel Agency.",
    alertCartSuccess: "Plan added to your cart!",
    alertCartFail: "Failed to add plan to cart.",

    // Cart Screen
    myCart: "My Cart",
    emptyCartTitle: "Your cart is empty",
    emptyCartSub: "Create a plan to start adding entertainments and foods.",
    addNewPlan: "Add a new plan",
    deletePlanTitle: "Delete Plan",
    deletePlanMsg: "Are you sure?",
    delete: "Delete",
    createPlan: "Create Plan",
    
    // Alerts (Cart)
    alertPlanNameReq: "Please enter a plan name.",
    alertDeleteFail: "Failed to delete.",

    // Cart Details / Order Form
    myTrip: "My Trip",
    editItinerary: "Edit Itinerary",
    orderForm: "Order Form",
    savedLocally: "Saved locally",
    specialRequests: "Special Requests:",
    specialReqPlaceholder: "Any allergies or special requirements?",
    confirmOrder: "Confirm Order",
    
    // Alerts (Order)
    confirmBookingTitle: "Confirm Booking",
    proceedOrder: "Proceed with order?",
    orderPlacedSuccess: "Your order has been placed successfully!",
    orderPlaceFail: "Failed to place order. Please try again.",
    missingAgencyTitle: "Missing Agency",
    
    // Delete Item
    removeItemTitle: "Remove Item",
    removeItemMsg: "Are you sure you want to remove this activity?",
    remove: "Remove",
    itemRemoveFail: "Failed to remove item.",

    // History (Orders)
    myOrders: "My Orders",
    tripOrder: "Trip Order",
    agency: "Agency",
    travelDate: "Travel Date",
    pax: "Pax",
    noOrders: "No orders yet.",
    bookTripHint: "Book a trip to see it here!",

    // Order Details
    orderDetails: "Order Details",
    viewRoute: "View Trip Route",
    customerInfo: "Customer Information",
    tripInfo: "Trip Details",
    itineraryItems: "Itinerary Items",
    totalPaid: "Total Paid",
    orderNotFound: "Order not found.",
    goBack: "Go Back",
    noLocationsTitle: "No Locations",
    noLocationsMsg: "No valid locations found to map.",
    errorMap: "Could not open Google Maps",
    loadingOrder: "Loading order...",

    // Agency Dashboard
    agencyDashboard: "Agency Dashboard",
    welcomeBack: "Welcome back,",
    addPlan: "Add Plan",
    addFood: "Add Food",
    addEnt: "Add Ent.",
    viewOrders: "View Orders",
    popularEnt: "Popular Entertainment",
    popularFood: "Popular Food",
    marketPlans: "All Market Plans",
    agencyProfile: "Agency Profile",
    manageServices: "Manage Services",
    loading: "Loading...",
    agencyPartner: "Agency Partner",
    yours: "(Yours)",
    noDesc: "No description",

    // Agency Upload
    uploadEntTitle: "Upload Entertainment",
    entId: "Entertainment ID:",
    uploadPic: "Upload Picture",
    changePic: "Change Picture",
    entName: "Entertainment Name",
    placeholderEntName: "e.g. Sunway Lagoon Ticket",
    ticketPriceRM: "Ticket Price (RM)",
    placeholderPrice: "e.g. 120",
    transportType: "Transport Type",
    placeholderTransport: "e.g. Bus/Taxi",
    transportCost: "Transport Cost",
    estTotalRM: "Est. Total (RM)",
    locationSearch: "Location Search",
    placeholderLocSearch: "Search Entertainment Location...",
    labelDescription: "Description",
    placeholderDescPackage: "Detailed description of the package...",
    reset: "Reset",
    
    // Alerts (Upload)
    alertLoginUpload: "You must be logged in to upload content.",
    alertFillAllUpload: "Please fill in Name, Ticket Price, Description, Location, and upload a Picture.",
    alertValidNumbers: "Ticket Price and Transport Price must be valid numbers.",
    alertEntUploaded: "Entertainment Package Uploaded!",
    alertUploadFailed: "Upload Failed",
    alertUnknownError: "An unknown error occurred during upload.",

    // Agency Upload Food
    uploadFoodTitle: "Upload Food",
    foodId: "Food ID:",
    foodName: "Food Name",
    placeholderFoodName: "e.g. Taiyaki",
    priceRangeRM: "Price Range (RM)",
    placeholderPriceRange: "10.00",
    cuisineType: "Cuisine Type",
    placeholderCuisine: "Japanese cuisine",
    placeholderRestSearch: "Search Restaurant Location...",
    
    // Alerts (Food Upload)
    alertFoodUploaded: "Food Item Uploaded!",
    alertFillAllFood: "Please fill in all fields and upload a picture.",

    // Agency Upload Plan
    uploadPlanTitle: "Upload Plan",
    planId: "Plan ID:",
    planName: "Plan Name",
    placeholderPlanNameTrip: "e.g. Cameron Highlands Trip",
    suggestedDays: "Suggested Days of Trip",
    selectDuration: "Select Duration",
    suggestedPax: "Suggested Pax",
    placeholderPax: "e.g. 10",
    selectEnt: "Select an Entertainment",
    selectFood: "Select a Food",
    estimatedCostPlan: "Estimated Cost",
    
    // Alerts (Plan Upload)
    alertPlanUploaded: "Trip Plan Uploaded!",
    alertFillAllPlan: "Please fill in Plan Name, Days, Pax, Cost and upload a Picture.",
    alertSelectOne: "Please select at least one Entertainment OR one Food option.",
    
    // Modals
    unnamedItem: "Unnamed Item",
    noItemsFound: "No items found.",

    // Agency Plan Details
    tripPlan: "Trip Plan",
    planEstimation: "Plan Estimation",
    estExpensesBreakdown: "Estimated Expenses Breakdown",

    // Agency Food Details
    diningDetails: "Dining Details",
    priceRangeLabel: "Price Range:",
    transportLabel: "Transport:",
    noLocationTitle: "No Location",
    noLocationMsg: "No location link provided.",
    errorMapApp: "Could not open map application.",
    foodNotFound: "Food details not found.",

    // Agency Entertainment Details
    activityDetails: "Activity Details",
    suggestedTransport: "Suggested Transport",
    aboutActivity: "About this activity",
    noDetails: "No additional details provided.",
    estTotalCost: "Estimated Total Cost",
    entNotFound: "Entertainment details not found.",

    // Agency Orders
    orderSales: "Order & Sales",
    totalRevenue: "Total Revenue",
    bookings: "Bookings",
    customers: "Customers",
    recentTrans: "Recent Transactions",
    all: "All",
    last3Days: "Last 3 Days",
    lastWeek: "Last Week",
    lastMonth: "Last Month",
    last6Months: "Last 6 Months",
    guest: "Guest",
    packageFee: "Package Fee",
    noSalesData: "No sales data for this period.",

    // Forgot Password
    checkEmailTitle: "Check your email",
    checkEmailSub1: "We sent a reset link to ",
    checkEmailSub2: "\nClick the link in that email to reset your password. Check your spam folder if you don't see it.",
    resendEmail: "Haven't received the email? Resend email",
    backToLogin: "Back to Log In",
    forgotPassTitle: "Forgot password",
    forgotPassSub: "Please enter your email to reset the password",
    sending: "Sending...",
    resetPassBtn: "Reset Password",
    errorPrefix: "Error: ",

    // Admin Dashboard
    adminDashboard: "Admin Dashboard",
    welcomeAdmin: "Welcome Admin",
    management: "Management",
    users: "Users",
    manageUsers: "Manage customer accounts",
    travelAgents: "Travel Agents",
    verifyAgents: "Verify agency partners",
    orders: "Orders",
    ordersReport: "Orders & Sales Report",
    systemStatus: "System Status: Online & Secured",
    admin: "Admin",
    systemSettings: "System Settings",

    // Admin Orders (Sales)
    adminControlCenter: "Admin Control Center",
    filterByDate: "Filter by Date",
    filterByAgency: "Filter by Agency",
    selectAgencies: "Select Agencies",
    agenciesSelected: "Agencies Selected",
    allAgencies: "All Agencies",
    allTime: "All Time",
    orderHistory: "Order History",
    searchAgency: "Search agency...",
    limitReached: "Limit Reached",
    limitMsg: "You can select up to 3 agencies only.",
    noMatchingOrders: "No matching orders found.",
    apply: "Apply",
    unknownAgency: "Unknown Agency",

    // Admin User List
    userManagement: "User Management",
    searchUsers: "Search Name, SSM or Email...",
    noUsersFound: "No users found.",
    editAgency: "Edit Agency",
    editUser: "Edit User",
    userIdReadOnly: "User ID (Read-Only)",
    agencyNameLabel: "Agency Name",
    enterAgencyName: "Enter Agency Name",
    enterFullName: "Enter Full Name",
    ssmLicense: "SSM License No.",
    enterSsm: "e.g. 202401000123",
    companyUrl: "Company Website URL",
    companyLogo: "Company Logo",
    tapToUploadLogo: "Tap to Upload Logo",
    profileImage: "Profile Image",
    setProfilePhoto: "Set Profile Photo",
    enterUsername: "Enter Username",
    enterEmail: "Enter Email",
    enterPhone: "Enter Phone No",
    saveChanges: "Save Changes",
    deleteUser: "Delete User",
    adminAccountNote: "Admin accounts cannot be deleted.",
    
    // Alerts (Admin User)
    permissionRequired: "Permission Required",
    galleryAccess: "Need gallery access to change photo.",
    updateSuccess: "Success",
    userUpdated: "User details updated successfully.",
    updateFail: "Failed to update user.",
    actionDenied: "Action Denied",
    adminDeleteError: "Admin accounts cannot be deleted.",
    confirmDelete: "Confirm Delete",
    deleteUserMsg: "Are you sure you want to remove",
    userDeleted: "User has been removed.",
    deleteFail: "Failed to delete user.",

    // Agency Registration
    agencyNameLabel: "Agency Name",
    companyUrlLabel: "Company URL",
    ssmLicenseLabel: "SSM License Number",
    companyLogoLabel: "Company Logo",
    placeholderAgencyName: "e.g. Dream Travel",
    placeholderUrl: "e.g. www.dreamtravel.com",
    
    // Alerts (Agency Reg)
    alertInvalidFileType: "Invalid File Type.\nPlease upload a JPG or PNG image only.",
    alertFillFieldsLogo: "Please fill in all fields and upload a logo.",
    alertInvalidSSM: "Invalid SSM License Number.\nPlease enter the 12-digit format (e.g., 202301000001) without dashes.",
    alertInvalidURL: "Please enter a valid Company URL.",
    alertRegSuccess: "Registration Successful!",
    alertAgencyRegComplete: "Agency Registration Complete!",

    // Admin Manage Agency
    agenciesManagement: "Agencies Management",
    unnamedAgency: "Unnamed Agency",
    licenseNo: "License No:",
    website: "Website:",
    approve: "Approve",
    reject: "Reject",
    statusPending: "PENDING",
    statusApproved: "APPROVED",
    statusRejected: "REJECTED",
    
    // Alerts (Agency Mgmt)
    alertFetchFail: "Failed to fetch agencies.",
    alertApproveFail: "Unable to approve agency.",
    alertRejectFail: "Unable to reject agency.",
    noAgenciesFound: "No agencies found.",

    // Admin Analytics
    analyticsDashboard: "Analytics Dashboard",
    revenueTrend: "Revenue Trend",
    ordersByAgency: "Orders by Agency",
    ordersPerDay: "Orders per Day",
    agenciesCount: "Agencies",
    ordersLabel: "Orders",
  },


  ms: {
    // Login
    login: "Log Masuk",
    signup: "Daftar",
    welcome: "Selamat Kembali",
    welcomeSub: "Log masuk untuk meneruskan perjalanan anda",
    email: "Emel Anda",
    password: "Kata Laluan",
    forgotPass: "Lupa kata laluan?",
    loginBtn: "Log Masuk",
    noAccount: "Tiada akaun?",
    
    // Register
    fullName: "Nama Penuh",
    username: "Nama Pengguna",
    dob: "Tarikh Lahir",
    phone: "Nombor Telefon",
    roleQuestion: "Adakah anda pelancong/ agensi pelancongan?",
    traveller: "Pelancong",
    agency: "Agensi Pelancongan",
    continue: "Teruskan",
    haveAccount: "Sudah mempunyai akaun?",
    placeholderName: "cth. Shane Lee",
    placeholderUsername: "cth. SuperTravel",
    placeholderEmail: "hubungi@email.com",
    placeholderDob: "HH/BB/TTTT",
    placeholderPhone: "cth. 0123456789",
    emailReadOnly: "Emel (Baca sahaja)",
    notSet: "Belum ditetapkan",

    // Alerts & Errors
    alertFillFields: "Sila isi semua butiran yang diperlukan.",
    alertPassShort: "Kata laluan terlalu pendek.\nIa mesti sekurang-kurangnya 6 aksara.",
    alertPhoneInvalid: "Sila masukkan nombor telefon Malaysia yang sah (cth., 011xxxxxxxx).",
    alertAccountCreated: "Akaun Berjaya Dicipta!",
    alertPermissionTitle: "Izin Diperlukan",
    alertPermissionMsg: "Benarkan akses ke foto untuk menukar gambar profil anda.",
    alertRequiredTitle: "Diperlukan",
    alertRequiredMsg: "Sila masukkan Nama dan Nombor Telefon.",
    alertSuccessTitle: "Berjaya",
    alertProfileUpdated: "Profil dikemaskini!",
    alertErrorTitle: "Ralat",
    alertUpdateFail: "Gagal mengemaskini profil.",
    
    // Profile
    myProfile: "Profil Saya",
    editProfile: "Sunting Profil",
    save: "Simpan",
    cancel: "Batal",
    changePhoto: "Tekan untuk tukar",
    
    // Settings
    account: "AKAUN",
    changePass: "Tukar Kata Laluan",
    support: "SOKONGAN & INFO",
    clearCache: "Bersihkan Cache",
    terms: "Terma Perkhidmatan",
    about: "Tentang Aplikasi",
    language: "Bahasa",
    switchLang: "Tukar ke Bahasa Melayu",

    // Home Page & Sidebar
    hi: "Hai,",
    sectionEnt: "Hiburan Disyorkan",
    emptyEnt: "Tiada hiburan ditemui.",
    sectionFood: "Makanan yang perlu dicuba",
    emptyFood: "Tiada tempat makan ditemui.",
    sectionPlan: "Pelan Disyorkan",
    emptyPlan: "Tiada pelan tersedia buat masa ini.",
    
    // Plan Card
    rating: "Penilaian",
    estimated: "Anggaran:",
    
    // Sidebar Menu
    menuOrders: "Pesanan",
    menuFav: "Kegemaran",
    menuSettings: "Tetapan",
    menuHelp: "Bantuan & Info",
    alertSupport: "Bantuan akan datang tidak lama lagi",
    logout: "Log Keluar",
    alertLogoutFail: "Gagal log keluar",

    // Details Screen (Entertainment & Food)
    peerRating: "Penilaian Rakan",
    about: "Tentang",
    costBreakdown: "Pecahan Kos",
    ticket: "Tiket",
    transport: "Pengangkutan",
    locationPreview: "Pratonton Lokasi",
    noMap: "Tiada peta lokasi tersedia",
    go: "Pergi",
    totalExpenses: "Jumlah Perbelanjaan",
    addToPlan: "Tambah ke Pelan",
    
    // Plan Modal
    newTripName: "Nama Perjalanan Baru",
    selectTrip: "Pilih Perjalanan",
    itemsCount: "item",
    noActivePlans: "Tiada pelan aktif.",
    createNewPlan: "Cipta Pelan Baru",
    placeholderPlanName: "cth. Pemburu Makanan Penang",
    back: "Kembali",
    createAndAdd: "Cipta & Tambah",

    // Alerts
    alertNoLocation: "Tiada Lokasi",
    alertNoLocationMsg: "Tiada pautan lokasi disediakan.",
    alertFetchPlanFail: "Gagal mendapatkan pelan anda.",
    alertTripNameReq: "Sila masukkan nama perjalanan.",
    alertCreateFail: "Gagal mencipta pelan.",
    alertAddedTo: "Ditambah ke", 
    alertAddToPlanFail: "Gagal menambah ke pelan.",

    // Food Details
    foodieRating: "Penilaian Pengunjung",
    aboutSpot: "Tentang Tempat Ini",
    estimatedCosts: "Anggaran Kos",
    priceRange: "Julat Harga",
    estimatedTotal: "Anggaran Jumlah",

    // Explore Screen
    explore: "Jelajah",
    findAdventure: "Cari pengembaraan seterusnya",
    searchEnt: "Cari Hiburan...",
    searchFood: "Cari Makanan...",
    popularAttractions: "Tarikan Popular",
    localDelicacies: "Hidangan Tempatan",
    found: "ditemui",
    noResults: "Tiada hasil ditemui.",
    noDesc: "Tiada penerangan tersedia.",

    // Plan Details Screen
    tripDetails: "Butiran Perjalanan",
    noSchedule: "Tiada jadual tersedia.",
    customizeTrip: "Sesuaikan Perjalanan Anda",
    from: "Dari:",
    to: "Hingga:",
    noOfPax: "Bilangan Pax:",
    travelAgencyLabel: "Agensi Pelancongan:",
    selectAgencyPlaceholder: "Pilih Agensi...",
    estimatedExpenses: "Anggaran Perbelanjaan",
    total: "Jumlah",
    addToCart: "Tambah ke Troli",
    
    // Default Schedule Items & Fees
    ticketEntry: "Tiket / Yuran Masuk",
    transportFee: "Yuran Pengangkutan",
    packageFee: "Yuran Pakej",
    estimatedCost: "Anggaran Kos",
    lunchBreak: "Rehat Makan Tengahari",
    freeEasy: "Masa Bebas",
    restTime: "Waktu Rehat",
    activity: "Aktiviti",

    // Chart Legend
    legendFood: "Makanan",
    legendEnt: "Hiburan",
    legendHotel: "Hotel",
    legendTransport: "Pengangkutan",

    // Agency Modal
    selectAgencyTitle: "Pilih Agensi",
    noAgencies: "Tiada agensi ditemui.",
    close: "Tutup",

    // Alerts
    alertNoPlanSelected: "Tiada pelan dipilih.",
    alertPlanNotFound: "Pelan tidak dijumpai.",
    alertLoadFail: "Gagal memuatkan butiran pelan.",
    alertLoginCart: "Anda mesti log masuk untuk menambah item ke troli.",
    alertSelectAgency: "Sila pilih Agensi Pelancongan.",
    alertCartSuccess: "Pelan ditambah ke troli anda!",
    alertCartFail: "Gagal menambah pelan ke troli.",

    // Cart Screen
    myCart: "Troli Saya",
    emptyCartTitle: "Troli anda kosong",
    emptyCartSub: "Cipta pelan untuk mula menambah hiburan dan makanan.",
    addNewPlan: "Tambah pelan baharu",
    deletePlanTitle: "Padam Pelan",
    deletePlanMsg: "Adakah anda pasti?",
    delete: "Padam",
    createPlan: "Cipta Pelan",
    
    // Alerts (Cart)
    alertPlanNameReq: "Sila masukkan nama pelan.",
    alertDeleteFail: "Gagal memadam.",

    // Cart Details / Order Form
    myTrip: "Perjalanan Saya",
    editItinerary: "Sunting Jadual",
    orderForm: "Borang Pesanan",
    savedLocally: "Disimpan secara tempatan",
    specialRequests: "Permintaan Khas:",
    specialReqPlaceholder: "Sebarang alahan atau keperluan khas?",
    confirmOrder: "Sahkan Pesanan",
    
    // Alerts (Order)
    confirmBookingTitle: "Sahkan Tempahan",
    proceedOrder: "Teruskan dengan pesanan?",
    orderPlacedSuccess: "Pesanan anda telah berjaya dibuat!",
    orderPlaceFail: "Gagal membuat pesanan. Sila cuba lagi.",
    missingAgencyTitle: "Tiada Agensi",
    
    // Delete Item
    removeItemTitle: "Buang Item",
    removeItemMsg: "Adakah anda pasti mahu membuang aktiviti ini?",
    remove: "Buang",
    itemRemoveFail: "Gagal membuang item.",

    // History (Orders)
    myOrders: "Pesanan Saya",
    tripOrder: "Pesanan Perjalanan",
    agency: "Agensi",
    travelDate: "Tarikh Perjalanan",
    pax: "Pax",
    noOrders: "Tiada pesanan lagi.",
    bookTripHint: "Tempah perjalanan untuk melihatnya di sini!",

    // Order Details
    orderDetails: "Butiran Pesanan",
    viewRoute: "Lihat Laluan Perjalanan",
    customerInfo: "Maklumat Pelanggan",
    tripInfo: "Butiran Perjalanan",
    itineraryItems: "Item Jadual Perjalanan",
    totalPaid: "Jumlah Dibayar",
    orderNotFound: "Pesanan tidak ditemui.",
    goBack: "Kembali",
    noLocationsTitle: "Tiada Lokasi",
    noLocationsMsg: "Tiada lokasi sah ditemui untuk dipetakan.",
    errorMap: "Gagal membuka Google Maps",
    loadingOrder: "Memuatkan pesanan...",

    // Agency Dashboard
    agencyDashboard: "Papan Pemuka Agensi",
    welcomeBack: "Selamat kembali,",
    addPlan: "Tambah Pelan",
    addFood: "Tambah Makanan",
    addEnt: "Tambah Hiburan",
    viewOrders: "Lihat Pesanan",
    popularEnt: "Hiburan Popular",
    popularFood: "Makanan Popular",
    marketPlans: "Semua Pelan Pasaran",
    agencyProfile: "Profil Agensi",
    manageServices: "Urus Perkhidmatan",
    loading: "Memuatkan...",
    agencyPartner: "Rakan Agensi",
    yours: "(Anda Punya)",
    noDesc: "Tiada penerangan",

    // Agency Upload
    uploadEntTitle: "Muat Naik Hiburan",
    entId: "ID Hiburan:",
    uploadPic: "Muat Naik Gambar",
    changePic: "Tukar Gambar",
    entName: "Nama Hiburan",
    placeholderEntName: "cth. Tiket Sunway Lagoon",
    ticketPriceRM: "Harga Tiket (RM)",
    placeholderPrice: "cth. 120",
    transportType: "Jenis Pengangkutan",
    placeholderTransport: "cth. Bas/Teksi",
    transportCost: "Kos Pengangkutan",
    estTotalRM: "Anggaran Jumlah (RM)",
    locationSearch: "Carian Lokasi",
    placeholderLocSearch: "Cari Lokasi Hiburan...",
    labelDescription: "Penerangan",
    placeholderDescPackage: "Penerangan terperinci pakej...",
    reset: "Tetap Semula",
    
    // Alerts (Upload)
    alertLoginUpload: "Anda mesti log masuk untuk memuat naik kandungan.",
    alertFillAllUpload: "Sila isi Nama, Harga Tiket, Penerangan, Lokasi, dan muat naik Gambar.",
    alertValidNumbers: "Harga Tiket dan Kos Pengangkutan mestilah nombor yang sah.",
    alertEntUploaded: "Pakej Hiburan Berjaya Dimuat Naik!",
    alertUploadFailed: "Gagal Memuat Naik",
    alertUnknownError: "Ralat tidak diketahui berlaku semasa memuat naik.",

    // Agency Upload Food
    uploadFoodTitle: "Muat Naik Makanan",
    foodId: "ID Makanan:",
    foodName: "Nama Makanan",
    placeholderFoodName: "cth. Taiyaki",
    priceRangeRM: "Julat Harga (RM)",
    placeholderPriceRange: "10.00",
    cuisineType: "Jenis Masakan",
    placeholderCuisine: "Masakan Jepun",
    placeholderRestSearch: "Cari Lokasi Restoran...",
    
    // Alerts (Food Upload)
    alertFoodUploaded: "Item Makanan Berjaya Dimuat Naik!",
    alertFillAllFood: "Sila isi semua ruangan dan muat naik gambar.",

    // Agency Upload Plan
    uploadPlanTitle: "Muat Naik Pelan",
    planId: "ID Pelan:",
    planName: "Nama Pelan",
    placeholderPlanNameTrip: "cth. Lawatan Cameron Highlands",
    suggestedDays: "Cadangan Hari Perjalanan",
    selectDuration: "Pilih Tempoh",
    suggestedPax: "Cadangan Pax",
    placeholderPax: "cth. 10",
    selectEnt: "Pilih Hiburan",
    selectFood: "Pilih Makanan",
    estimatedCostPlan: "Anggaran Kos",
    
    // Alerts (Plan Upload)
    alertPlanUploaded: "Pelan Perjalanan Berjaya Dimuat Naik!",
    alertFillAllPlan: "Sila isi Nama Pelan, Hari, Pax, Kos dan muat naik Gambar.",
    alertSelectOne: "Sila pilih sekurang-kurangnya satu Hiburan ATAU satu Makanan.",
    
    // Modals
    unnamedItem: "Item Tanpa Nama",
    noItemsFound: "Tiada item ditemui.",

    // Agency Plan Details
    tripPlan: "Pelan Perjalanan",
    planEstimation: "Anggaran Pelan",
    estExpensesBreakdown: "Pecahan Anggaran Perbelanjaan",

    // Agency Food Details
    diningDetails: "Butiran Makan",
    priceRangeLabel: "Julat Harga:",
    transportLabel: "Pengangkutan:",
    noLocationTitle: "Tiada Lokasi",
    noLocationMsg: "Tiada pautan lokasi disediakan.",
    errorMapApp: "Gagal membuka aplikasi peta.",
    foodNotFound: "Butiran makanan tidak ditemui.",

    // Agency Entertainment Details
    activityDetails: "Butiran Aktiviti",
    suggestedTransport: "Pengangkutan Dicadangkan",
    aboutActivity: "Tentang aktiviti ini",
    noDetails: "Tiada butiran tambahan disediakan.",
    estTotalCost: "Anggaran Jumlah Kos",
    entNotFound: "Butiran hiburan tidak ditemui.",

    // Agency Orders
    orderSales: "Pesanan & Jualan",
    totalRevenue: "Jumlah Hasil",
    bookings: "Tempahan",
    customers: "Pelanggan",
    recentTrans: "Transaksi Terkini",
    all: "Semua",
    last3Days: "3 Hari Lepas",
    lastWeek: "Minggu Lepas",
    lastMonth: "Bulan Lepas",
    last6Months: "6 Bulan Lepas",
    guest: "Tetamu",
    packageFee: "Yuran Pakej",
    noSalesData: "Tiada data jualan untuk tempoh ini.",

    // Forgot Password
    checkEmailTitle: "Periksa emel anda",
    checkEmailSub1: "Kami telah menghantar pautan tetapan semula ke ",
    checkEmailSub2: "\nKlik pautan dalam emel tersebut untuk menetapkan semula kata laluan anda. Periksa folder spam jika tiada.",
    resendEmail: "Belum terima emel? Hantar semula",
    backToLogin: "Kembali ke Log Masuk",
    forgotPassTitle: "Lupa Kata Laluan",
    forgotPassSub: "Sila masukkan emel anda untuk menetapkan semula kata laluan",
    sending: "Menghantar...",
    resetPassBtn: "Tetapkan Semula Kata Laluan",
    errorPrefix: "Ralat: ",

    // Admin Dashboard
    adminDashboard: "Papan Pemuka Admin",
    welcomeAdmin: "Selamat Datang Admin",
    management: "Pengurusan",
    users: "Pengguna",
    manageUsers: "Urus akaun pelanggan",
    travelAgents: "Ejen Pelancongan",
    verifyAgents: "Sahkan rakan kongsi agensi",
    orders: "Pesanan",
    ordersReport: "Laporan Pesanan & Jualan",
    systemStatus: "Status Sistem: Dalam Talian & Selamat",
    admin: "Admin",
    systemSettings: "Tetapan Sistem",

    // Admin Orders (Sales)
    adminControlCenter: "Pusat Kawalan Admin",
    filterByDate: "Tapis ikut Tarikh",
    filterByAgency: "Tapis ikut Agensi",
    selectAgencies: "Pilih Agensi",
    agenciesSelected: "Agensi Dipilih",
    allAgencies: "Semua Agensi",
    allTime: "Semua Masa",
    orderHistory: "Sejarah Pesanan",
    searchAgency: "Cari agensi...",
    limitReached: "Had Dicapai",
    limitMsg: "Anda boleh memilih sehingga 3 agensi sahaja.",
    noMatchingOrders: "Tiada pesanan yang sepadan ditemui.",
    apply: "Terapkan",
    unknownAgency: "Agensi Tidak Diketahui",

    // Admin User List
    userManagement: "Pengurusan Pengguna",
    searchUsers: "Cari Nama, SSM atau Emel...",
    noUsersFound: "Tiada pengguna ditemui.",
    editAgency: "Sunting Agensi",
    editUser: "Sunting Pengguna",
    userIdReadOnly: "ID Pengguna (Baca Sahaja)",
    agencyNameLabel: "Nama Agensi",
    enterAgencyName: "Masukkan Nama Agensi",
    enterFullName: "Masukkan Nama Penuh",
    ssmLicense: "No. Lesen SSM",
    enterSsm: "cth. 202401000123",
    companyUrl: "URL Laman Web Syarikat",
    companyLogo: "Logo Syarikat",
    tapToUploadLogo: "Tekan untuk Muat Naik Logo",
    profileImage: "Gambar Profil",
    setProfilePhoto: "Tetapkan Gambar Profil",
    enterUsername: "Masukkan Nama Pengguna",
    enterEmail: "Masukkan Emel",
    enterPhone: "Masukkan No Telefon",
    saveChanges: "Simpan Perubahan",
    deleteUser: "Padam Pengguna",
    adminAccountNote: "Akaun admin tidak boleh dipadam.",
    
    // Alerts (Admin User)
    permissionRequired: "Kebenaran Diperlukan",
    galleryAccess: "Perlukan akses galeri untuk menukar gambar.",
    updateSuccess: "Berjaya",
    userUpdated: "Butiran pengguna berjaya dikemaskini.",
    updateFail: "Gagal mengemaskini pengguna.",
    actionDenied: "Tindakan Ditolak",
    adminDeleteError: "Akaun admin tidak boleh dipadam.",
    confirmDelete: "Sahkan Padam",
    deleteUserMsg: "Adakah anda pasti mahu membuang",
    userDeleted: "Pengguna telah dibuang.",
    deleteFail: "Gagal memadam pengguna.",

    // Agency Registration
    agencyNameLabel: "Nama Agensi",
    companyUrlLabel: "URL Syarikat",
    ssmLicenseLabel: "Nombor Lesen SSM",
    companyLogoLabel: "Logo Syarikat",
    placeholderAgencyName: "cth. Dream Travel",
    placeholderUrl: "cth. www.dreamtravel.com",
    
    // Alerts (Agency Reg)
    alertInvalidFileType: "Jenis Fail Tidak Sah.\nSila muat naik imej JPG atau PNG sahaja.",
    alertFillFieldsLogo: "Sila isi semua ruangan dan muat naik logo.",
    alertInvalidSSM: "Nombor Lesen SSM Tidak Sah.\nSila masukkan format 12 digit (cth. 202301000001) tanpa sengkang.",
    alertInvalidURL: "Sila masukkan URL Syarikat yang sah.",
    alertRegSuccess: "Pendaftaran Berjaya!",
    alertAgencyRegComplete: "Pendaftaran Agensi Selesai!",

    // Admin Manage Agency
    agenciesManagement: "Pengurusan Agensi",
    unnamedAgency: "Agensi Tanpa Nama",
    licenseNo: "No Lesen:",
    website: "Laman Web:",
    approve: "Lulus",
    reject: "Tolak",
    statusPending: "MENUNGGU",
    statusApproved: "DILULUSKAN",
    statusRejected: "DITOLAK",
    
    // Alerts (Agency Mgmt)
    alertFetchFail: "Gagal mendapatkan agensi.",
    alertApproveFail: "Tidak dapat meluluskan agensi.",
    alertRejectFail: "Tidak dapat menolak agensi.",
    noAgenciesFound: "Tiada agensi ditemui.",

    // Admin Analytics
    analyticsDashboard: "Papan Pemuka Analitik",
    revenueTrend: "Trend Hasil",
    ordersByAgency: "Pesanan mengikut Agensi",
    ordersPerDay: "Pesanan setiap Hari",
    agenciesCount: "Agensi",
    ordersLabel: "Pesanan",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Default to English

  // Helper function to get the translation
  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);