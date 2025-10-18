
import React, { useState, useEffect } from 'react';
import AnalysisPanel from './components/AnalysisPanel';
import GeneratedImage from './components/GeneratedImage';
import Loader from './components/Loader';
import StoryPreview from './components/StoryPreview';
import StorytellingOutput from './components/StorytellingOutput';
import { generateImageFromPrompt, generateStorylinePrompts, generateSocialMediaPackage, analyzeImageForGender } from './services/geminiService';

type Scene = { 
    id: number; 
    prompt: string; 
    generatedImageUrl: string | null; 
    isLoading: boolean; 
};
interface SocialMediaPackage {
  title: string;
  intro: string;
  cta: string;
  hashtags: string;
}

// Existing Options
const aspectRatios = ["9:16 (Vertikal)", "16:9 (Horizontal)", "1:1 (Persegi)", "4:3 (Klasik)", "3:4 (Potret)"];
const subjects = ["Pria", "Wanita", "Anak-anak"];
const ageOptions = Array.from({ length: 101 }, (_, i) => String(i));
const times = ["Pagi", "Menjelang Siang", "Siang", "Sore", "Malam"];
const postures = ["Tinggi", "Sedang", "Pendek"];
const bodies = ["Ideal", "Sedang", "Agak Gendut", "Gendut", "Gendut Banget"];
const resolutions = ["Rendah", "Normal", "Tinggi", "2K", "4K", "8K"];
const clothingOptions = ["Pilih Pakaian...", "Setelan Jas", "Gaun Malam", "Blazer & Kemeja", "Kasual Kantor", "Kaos & Jeans", "Sweater Nyaman", "Jaket Kulit", "Gaun Musim Panas", "Pakaian Olahraga", "Bohemian", "Vintage 70-an", "Jas Lab (Dokter/Ilmuwan)", "Seragam Koki", "Scrub Medis", "Pakaian Petualang (Safari)"];
const faceSimilarityOptions = ["Sangat Mirip (Pertahankan Wajah Asli)", "Mirip (Fleksibel)", "Terinspirasi (Karakter Baru)"];
const cameraOptions = [
    "Auto-deteksi (Rekomendasi)", 
    "Wide Angle Shot (Pemandangan Luas)", 
    "Medium Shot (Setengah Badan)", 
    "Close-Up Shot (Wajah & Ekspresi)", 
    "Extreme Close-Up (Detail Kecil)", 
    "Point of View (POV) Shot", 
    "Drone Shot (Dari Atas)",
    "Low Angle Shot (Subjek terlihat kuat/besar)",
    "High Angle Shot (Subjek terlihat rentan/kecil)",
    "Dutch Angle (Menciptakan disorientasi/ketegangan)",
    "Tracking Shot (Mengikuti subjek yang bergerak)",
    "Orbit Shot (Mengelilingi subjek)"
];

const NONE_OPTION = "Tidak Ada Pilihan (None)";
const costumeOptions = [NONE_OPTION, "Tulis Manual"];

// Storyboard Options
const cinematicPlantationOptions = [
    NONE_OPTION,
    // --- Buah-buahan Umum ---
    "Berjalan di antara kebun apel merah yang rimbun saat panen",
    "Pohon pir dengan buah keemasan di pagi berkabut",
    "Hamparan kebun anggur di perbukitan Italia saat senja",
    "Memetik stroberi di ladang yang siap panen",
    "Barisan pohon ceri berbunga merah muda di musim semi",
    "Duduk di bawah pohon persik dengan buah matang",
    "Kebun plum ungu gelap setelah hujan ringan",
    // --- Buah-buahan Tropis & Eksotis ---
    "Perkebunan pisang tropis yang lebat di hutan hujan",
    "Memanjat pohon mangga berbuah lebat di pedesaan",
    "Petani membuka durian di kebun Asia Tenggara",
    "Ladang nanas di tanah vulkanik Hawaii",
    "Menikmati kelapa muda di tepi pantai",
    "Perkebunan leci merah delima yang eksotis",
    "Pohon rambutan berambut merah yang unik",
    // --- Biji-bijian & Serealia ---
    "Berdiri di tengah ladang gandum emas yang bergoyang ditiup angin",
    "Sawah terasering bertingkat di Bali saat matahari terbit",
    "Tersesat di labirin ladang jagung tinggi di pedesaan Amerika",
    // --- Tanaman Komersial & Bunga ---
    "Memetik biji kopi di lereng gunung berkabut",
    "Upacara minum teh di perkebunan teh hijau di perbukitan Jepang",
    "Menjelajahi perkebunan kakao (cokelat) di hutan hujan",
    "Berlari di ladang bunga matahari menghadap matahari terbit",
    "Perkebunan tebu yang tinggi dan rapat di Kuba",
    "Ladang kapas putih di bawah langit biru Texas",
    "Berjalan di kebun zaitun kuno di Yunani",
    "Bersepeda melewati ladang lavender ungu di Provence, Prancis",
    "Ladang tulip berwarna-warni di Belanda saat festival",
    "Peternak lebah dengan hati-hati mengambil sarang madu yang penuh dari kotak sarang lebah di antara ladang bunga liar",
    // --- Tambahan Lama ---
    "Melihat kebun kopi dari balkon villa kayu di pagi hari.",
    "Petani memanen cengkeh di bawah terik matahari Maluku.",
    "Jalan setapak tanah merah membelah perkebunan kelapa sawit yang tak berujung.",
    "Menyusuri kebun vanili yang rimbun dan aromatik.",
    "Pemandangan drone perkebunan karet yang tertata rapi dari atas.",
    "Bersembunyi di antara barisan pohon kakao yang rendah dan berbuah lebat.",
    "Tangan seorang petani dengan lembut membelai biji kopi merah matang di cabang pohon.",
    "Pemandangan dari dalam gubuk bambu, melihat ke luar ke sawah terasering yang diguyur hujan.",
    "Anak-anak berlari gembira melewati ladang bunga matahari yang menjulang tinggi, tertawa.",
    "Drone shot mengorbit perlahan di sekitar pohon durian tunggal yang besar dan berbuah lebat di tengah hutan.",
    "Close-up tetesan getah karet putih yang menetes perlahan ke dalam mangkuk tanah liat.",
    // --- Tambahan Baru ---
    "Menyortir biji pala yang baru dipanen di sebuah gudang kayu yang remang-remang.",
    "Berjalan di bawah kanopi perkebunan markisa dengan buah-buahan ungu bergelantungan.",
    "Close-up tangan yang memeras tebu untuk membuat jus segar di pasar lokal.",
    "Pemandangan udara dari perkebunan teh berbentuk labirin di perbukitan Cameron Highlands.",
    "Anak-anak bermain petak umpet di antara pohon-pohon karet yang tinggi.",
];
const cinematicMountainOptions = [
    NONE_OPTION,
    "Pendaki di puncak gunung saat matahari terbit, siluet.",
    "Berjalan santai melewati padang bunga liar yang berwarna-warni.",
    "Duduk di tepi tebing, memandang lembah berkabut di bawah.",
    "Menyalakan api unggun di hutan pinus saat senja.",
    "Refleksi gunung di danau yang tenang dan jernih.",
    "Berdiri di belakang air terjun yang deras dan megah.",
    "Menjelajahi gua es glasial yang biru dan bercahaya.",
    "Menyeberangi jembatan gantung di atas ngarai yang dalam.",
    "Menunggang kuda melintasi gurun pasir saat matahari terbenam.",
    "Berjalan di pantai berpasir putih saat ombak lembut menyapu kaki.",
    "Menyelam di terumbu karang yang penuh warna di perairan biru jernih.",
    "Menjelajahi reruntuhan kuno yang tersembunyi di dalam hutan lebat.",
    "Mendayung kayak sendirian di danau glasial yang dikelilingi puncak bersalju.",
    "Berbaring di padang rumput sabana Afrika, memandangi bintang.",
    // --- Tambahan Lama ---
    "Melintasi padang sabana kering dengan latar belakang gunung berbatu.",
    "Memancing di sungai deras yang mengalir dari pegunungan es.",
    "Menemukan sebuah kuil kuno yang tersembunyi di lereng gunung berkabut.",
    "Bersepeda gunung menuruni jalur curam dengan pemandangan lembah.",
    "Mengamati elang terbang tinggi di atas ngarai yang dalam.",
    "Beristirahat di hammock yang terikat di antara dua pohon pinus di lereng gunung.",
    // --- Tambahan Baru ---
    "Terbang dengan paralayang di atas lembah pegunungan yang hijau.",
    "Menemukan danau tersembunyi berwarna pirus di kawah gunung berapi yang sudah tidak aktif.",
    "Berdiri di tepi jurang, berteriak dan mendengarkan gema yang memantul.",
    "Menjelajahi padang lumut yang luas dan sureal di dataran tinggi.",
    "Mengikuti jejak serigala di salju tebal menuju hutan pinus.",
];
const cinematicUrbanOptions = [
    NONE_OPTION,
    "Berdiri di tengah penyeberangan jalan Tokyo yang ramai, motion blur.",
    "Refleksi lampu neon kota di genangan air setelah hujan.",
    "Duduk sendirian di kafe Paris larut malam, memandang ke luar jendela.",
    "Menunggu kereta di stasiun kereta bawah tanah London yang kosong.",
    "Berjalan di gang sempit dengan grafiti artistik di Berlin.",
    "Di atas atap gedung pencakar langit New York, memandang kota saat senja.",
    "Berbelanja di pasar malam Bangkok yang ramai dan penuh warna.",
    "Membaca di perpustakaan tua yang megah dengan rak buku menjulang.",
    "Naik gondola di kanal Venesia yang tenang saat fajar.",
    "Memandang kota cyberpunk dari jendela apartemen di gedung pencakar langit.",
    "Tersesat di pasar Maroko yang ramai dan penuh warna.",
    "Duduk di bar jazz yang remang-remang, mendengarkan saksofon melankolis.",
    "Berjalan di Jembatan Brooklyn saat malam hari, lampu kota berkilauan.",
     // --- Tambahan Lama ---
    "Memotret arsitektur brutalist di distrik pemerintahan yang sepi.",
    "Bermain basket di lapangan beton yang dikelilingi gedung apartemen tinggi.",
    "Menikmati kopi di rooftop cafe dengan pemandangan kota 360 derajat.",
    "Berjalan melewati pasar bunga yang ramai di pagi hari.",
    "Menonton pertunjukan jalanan di alun-alun kota yang bersejarah.",
    "Melintasi jembatan penyeberangan futuristik di malam hari, diterangi lampu LED.",
    // --- Tambahan Baru ---
    "Duduk di tangga darurat sebuah gedung apartemen, memandang ke gang di bawah.",
    "Mengejar bus tingkat merah yang melaju di jalanan London yang basah karena hujan.",
    "Makan semangkuk ramen di kedai kecil yang ramai di gang belakang Shinjuku.",
    "Bersepeda melewati jembatan Golden Gate saat kabut tebal mulai turun.",
    "Berdebat dengan pedagang di Grand Bazaar Istanbul yang ramai.",
];
const cinematicFishingOptions = [
    NONE_OPTION,
    // --- Tema Asia Tenggara & Tradisional ---
    "Melempar jala di Delta Mekong saat fajar, siluet melawan matahari terbit oranye.",
    "Close-up tangan tua yang keriput memperbaiki jaring nilon hijau di atas perahu kayu.",
    "Menyusuri sungai keruh di pedalaman Borneo dengan sampan, mencari ikan snakehead.",
    "Pemandangan dari atas perahu long-tail di Thailand, air memercik saat melaju kencang.",
    "Anak-anak tertawa sambil memancing dengan pancing bambu sederhana di tepi sawah.",
    "Memeriksa perangkap ikan (bubu) yang terbuat dari bambu di perairan dangkal yang tenang.",
    "Nelayan di Teluk Halong, Vietnam, berdiri di atas perahu di antara pilar-pilar karst yang megah.",
    "Pasar terapung yang ramai, seorang wanita menjual ikan segar langsung dari perahunya.",
    "Menombak ikan (spearfishing) di terumbu karang yang jernih di perairan Raja Ampat.",
    "Menarik jaring pukat di pantai Filipina saat senja, seluruh desa membantu.",
    "Duduk di dermaga kayu rumah panggung di atas Danau Tonlé Sap, Kamboja, kaki berayun di atas air.",
    "Memancing cumi-cumi di malam hari di lepas pantai Malaysia, di bawah cahaya lampu hijau terang.",
    "Close-up ikan gurami bakar yang sedang dimasak di atas bara api di tepi sungai.",
    "Di tengah hujan monsun, seorang nelayan bertopi kerucut melemparkan umpannya ke sungai yang deras.",
    "Pemandangan bawah air: sekelompok ikan kecil berenang di sekitar perangkap bambu.",
    "Mengayuh perahu melewati hutan bakau yang lebat, akar-akar pohon mencuat dari air payau.",
    "Seorang nelayan dengan bangga mengangkat ikan lele Mekong raksasa yang baru ditangkap.",
    "Pemandangan dari dalam gubuk nelayan, melihat ke luar ke arah keramba jaring apung.",
    "Menjual hasil tangkapan hari itu di pasar ikan yang sibuk dan becek di Jakarta.",
    "POV (Point of View) melempar umpan ke kolam teratai yang tenang.",
    "Seorang wanita membersihkan sisik ikan dengan pisau di atas talenan kayu di beranda rumah panggungnya.",
    "Drone shot mengikuti perahu nelayan tunggal yang membelah perairan zamrud yang tenang.",
    "Mencari kepiting bakau di antara akar-akar pohon saat air surut.",
    "Memancing belut dari lubang-lubang di pematang sawah berlumpur.",
    "Ayah dan anak memeriksa jaring mereka yang tergantung di antara dua tiang di perairan dangkal.",
    "Suasana damai di keramba apung saat senja, memberi makan ikan.",
    "Berdiri di haluan perahu phinisi, memancing ikan tuna di perairan dalam Indonesia.",
    "Extreme close-up mata ikan segar yang jernih di keranjang pasar.",
    "Nelayan Intha di Danau Inle, Myanmar, mendayung dengan satu kaki sambil melemparkan jaring berbentuk kerucut.",
    "Melewati desa nelayan di atas tiang-tiang di Teluk Phang Nga, Thailand.",
    "Memegang lentera, berjalan di perairan dangkal di malam hari untuk mencari udang.",
    "Pemandangan dari jembatan bambu, melihat ke bawah pada perahu yang lewat di sungai kecil.",
    "Tangan yang terampil mengikat umpan lalat buatan tangan yang meniru serangga lokal.",
    "Seorang nelayan menyeruput kopi kental di warung tepi pelabuhan sebelum berangkat melaut.",
    "Slow motion jaring yang dilempar membentuk lingkaran sempurna di atas permukaan air.",
    "Bayangan perahu dan nelayan terpantul di air yang tenang seperti cermin saat fajar.",
    "Menarik tali panjang dengan puluhan kail (rawai) dari perairan dalam.",
    "Seorang biksu Buddha melepaskan ikan kembali ke sungai sebagai perbuatan baik.",
    "Pemandangan luas dari atas bukit, melihat armada perahu nelayan berwarna-warni di pelabuhan.",
    "Memancing di kolam pemancingan komersial di pinggiran kota Bangkok, penuh sesak dengan pemancing lain.",
    "Close-up udang galah biru segar yang baru diangkat dari perangkap.",
    "Menyeimbangkan diri di atas rakit bambu sambil memeriksa jaring di sungai yang mengalir lambat.",
    "Refleksi awan putih di permukaan air sawah yang baru ditanami, seorang pria memancing di tepinya.",
    "Mengarungi perairan dangkal dengan kerbau, sambil membawa peralatan memancing.",
    "Di bawah jembatan kayu yang ramai, seorang pria memancing dengan sabar di tengah hiruk pikuk kota.",
    "Pemandangan melalui jendela bus yang bergerak, sekilas melihat orang-orang memancing di kanal.",
    "Burung-burung laut mengikuti perahu nelayan, berharap mendapat sisa tangkapan.",
    "Seorang nelayan tua dengan tato tradisional di punggungnya menarik perahunya ke darat.",
    "Di sebuah restoran terapung, memilih ikan hidup dari jaring untuk dimasak.",
    "Anak-anak kecil dengan gembira menangkap ikan-ikan kecil di selokan dengan jaring tangan.",
    "Pemandangan malam hari di Sungai Chao Phraya, dengan latar belakang kuil-kuil yang bercahaya.",
    "Low angle shot dari dalam air, melihat ke atas pada siluet perahu dan langit.",
    "Memancing dari kayak di antara pulau-pulau karst kecil di Krabi, Thailand.",
    "Seorang wanita menenun perangkap ikan dari rotan di teras rumahnya.",
    "Drone mengorbit di sekitar 'bagan', sebuah platform bambu stasioner untuk memancing di laut.",
    "Proses mengasinkan dan mengeringkan ikan di rak-rak bambu di bawah terik matahari.",
    "Memancing di muara sungai saat air pasang datang, tempat air tawar bertemu air asin.",
    "Close-up riak air yang menyebar setelah umpan dilemparkan.",
    "Seorang nelayan meniup keong sebagai terompet untuk memanggil rekan-rekannya.",
    "High angle shot dari sebuah tebing, melihat ke bawah pada seorang nelayan yang melempar jaring ke ombak.",
    "Mempersiapkan umpan dari cacing atau udang kecil di atas perahu yang bergoyang.",
    "Menikmati semangkuk sup ikan panas di atas perahu setelah seharian memancing.",
    "Melihat ikan lumba-lumba Irrawaddy yang langka saat memancing di sungai Myanmar.",
    "Membersihkan perahu kayu dari teritip dan lumut di tepi pantai.",
    "Memancing di danau kawah vulkanik yang tenang di Indonesia.",
    "Tracking shot mengikuti seekor kepiting yang berjalan menyamping di lumpur bakau.",
    "Seorang pemandu lokal menunjukkan cara menemukan kerang di pasir saat air surut.",
    "Menggunakan layang-layang untuk membawa kail dan umpan lebih jauh ke laut, teknik tradisional Suku Bugis.",
    "Pemandangan dari atas kapal feri, melihat para nelayan di perahu-perahu kecil mereka.",
    "Di tengah kabut pagi yang tebal, hanya terdengar suara dayung yang memecah air.",
    "Menjual ikan hias yang ditangkap dari sungai-sungai pedalaman di pasar hewan.",
    "Seorang nelayan menunjukkan bekas luka dari pertarungan dengan ikan besar.",
    "Memancing di perairan sekitar kuil kuno yang sebagian terendam air.",
    "Menggunakan pelampung dari gabus atau bambu yang dicat cerah.",
    "Extreme close-up sisik ikan berwarna-warni yang berkilauan di bawah sinar matahari.",
    "Nelayan Bajau (Gipsi Laut) menyelam bebas ke kedalaman untuk menombak ikan.",
    "Pemandangan dari rumah panggung, menurunkan keranjang untuk membeli ikan dari pedagang yang lewat dengan perahu.",
    "Menyiapkan 'rumpon', tempat berkumpul ikan buatan di bawah air, dari daun kelapa.",
    "Ombak pecah di atas perahu cadik tradisional saat melawan gelombang.",
    "Seorang seniman melukis pemandangan nelayan di pelabuhan dengan cat air.",
    "Memasak ikan dalam bambu di atas api unggun.",
    "Melempar umpan tiruan (lure) berbentuk ikan kecil di perairan jernih.",
    "Seorang nelayan beristirahat di tempat tidur gantung yang diikat di perahunya.",
    "Budidaya mutiara di teluk yang tenang, memeriksa tiram-tiram.",
    "Anak-anak menggunakan ember untuk mencoba menangkap ikan di genangan air setelah banjir.",
    "Pemandangan dari kereta yang melintasi pedesaan, melihat orang-orang memancing di setiap badan air.",
    "Close-up tangan yang dengan ahli mengiris ikan untuk dijadikan sashimi segar di pasar.",
    "Berdiri setinggi pinggang di air, mendorong jaring dorong di depan.",
    "Seorang dukun melakukan ritual untuk memberkati perahu baru sebelum pelayaran pertamanya.",
    "Pemandangan malam berbintang dari tengah laut, jauh dari polusi cahaya kota.",
    "Mengumpulkan teripang dari dasar laut saat air surut.",
    "Seorang nelayan tua menceritakan kisah tentang roh-roh sungai kepada cucunya.",
    "Drone shot lurus ke bawah, menunjukkan pola jaring laba-laba yang ditinggalkan oleh perahu di air yang tenang.",
    "Memancing di dekat air terjun kecil di hutan, airnya dingin dan jernih.",
    "Seorang wanita dengan terampil menggunakan kedua tangan dan kakinya untuk mengendalikan sampan sambil menjala.",
    "Lampu-lampu dari desa nelayan berkelip di seberang teluk di malam hari.",
    "Mengamati pertarungan antara seekor burung pemakan ikan dan seekor ikan di permukaan air.",
    "Jejak kaki di pasir basah menuju perahu nelayan yang terdampar saat fajar.",
    "Menggunakan senter kepala, mencari katak di sawah pada malam hari.",
    "Tersenyum puas sambil memegang hasil tangkapan, dengan latar belakang matahari terbenam yang spektakuler.",
    // --- Laut Dalam & Modern ---
    "Bertarung dengan ikan marlin raksasa di perairan biru Samudra Pasifik.",
    "Menarik ikan tuna sirip kuning besar ke atas kapal saat fajar.",
    "Spearfishing di sekitar kapal karam tua yang ditumbuhi karang.",
    // --- Umum / Bisa di Mana Saja ---
    "Berdiri di atas batu karang, memancing di pantai saat ombak besar menghantam.",
    "Seorang ayah mengajari anaknya cara memancing di dermaga kayu di danau.",
];
const cinematicBeachOptions = [
    NONE_OPTION,
    "Berjalan sendirian di tepi pantai saat matahari terbenam, jejak kaki di pasir basah.",
    "Ombak besar pecah di bebatuan karang dengan percikan air yang dramatis.",
    "Api unggun di pantai pada malam hari bersama teman-teman, tertawa dan bermain gitar.",
    "Pemandangan dari atas tebing, melihat ke bawah ke teluk tersembunyi dengan air pirus.",
    "Anak-anak membangun istana pasir dengan gembira di bawah sinar matahari.",
    "Berbaring di tempat tidur gantung di antara dua pohon palem, dengan buku di tangan.",
    "Menunggang kuda di sepanjang garis pantai saat fajar.",
    "Menemukan bintang laut berwarna-warni di genangan air saat air surut.",
    "Snorkeling di antara ikan-ikan tropis di dekat pantai yang jernih.",
    "Drone shot dari sebuah pulau kecil berpasir putih dikelilingi lautan biru.",
    "Duduk di bar pantai kayu sambil menikmati minuman kelapa muda.",
    "Peselancar menunggu ombak yang sempurna saat senja."
];
const cinematicPetCatOptions = [
    NONE_OPTION,
    "Seekor kucing jahe tidur pulas di bawah sinar matahari yang masuk dari jendela.",
    "Close-up mata kucing yang tajam dan waspada saat mengintai mainan.",
    "Kucing hitam yang elegan berjalan dengan anggun di atas pagar tembok.",
    "Anak kucing yang penasaran dan lucu bermain dengan bola benang wol berwarna-warni.",
    "Kucing berbulu lebat mendengkur puas saat dibelai di sofa yang nyaman.",
    "POV (Point of View) dari seekor kucing yang bersembunyi dan mengintip dari bawah tempat tidur.",
    "Kucing melompat dengan lincah dan tanpa suara ke rak buku yang tinggi.",
    "Siluet kucing duduk di ambang jendela saat senja, memandang ke luar ke kota.",
    "Momen lucu saat kucing mencoba masuk ke dalam kotak kardus yang terlalu kecil.",
    "Tangan seseorang dengan lembut memberi makan anak kucing dari botol susu.",
    "Kucing sedang membersihkan dirinya (grooming) dengan teliti di karpet.",
    "Dua kucing bermain kejar-kejaran di sekitar ruang tamu."
];
const cinematicProductFlexingOptions = [
    NONE_OPTION,
    "Produk ditampilkan secara dramatis di atas alas marmer dengan pencahayaan spot.",
    "Tangan meraih produk dengan gerakan lambat, dikelilingi partikel debu emas.",
    "Produk diletakkan di tepi tebing dengan latar belakang matahari terbenam yang megah.",
    "Zoom-in ekstrem pada detail produk, menyoroti tekstur dan pengerjaan yang halus.",
    "Produk jatuh ke dalam air jernih, menciptakan riak dan gelembung dalam gerakan lambat (slow motion).",
    "Produk dipegang oleh model di tengah jalan kota yang ramai di malam hari, dengan lampu neon buram.",
    "Percikan air berwarna membeku di sekitar produk dengan latar belakang gelap.",
    "Produk muncul dari bayang-bayang gelap, secara perlahan diterangi oleh satu sumber cahaya.",
    "Produk diletakkan di atas pasir hitam vulkanik dengan asap misterius di sekelilingnya.",
    "Refleksi produk di cermin pecah, menciptakan efek visual yang artistik dan terfragmentasi.",
    "Produk dikelilingi oleh bunga atau elemen alam yang tumbuh dengan cepat (timelapse).",
    "Produk melayang di udara di sebuah ruangan minimalis yang bersih dan futuristik.",
];
const cinematicMiscOptions = [
    NONE_OPTION,
    "Membaca buku di dekat perapian yang hangat dan berderak.",
    "Close-up tangan memainkan tuts piano dengan lembut dan penuh perasaan.",
    "Menari di bawah hujan dengan gembira dan bebas di tengah jalan.",
    "Mengendarai mobil convertible di jalan pesisir saat matahari terbenam.",
    "Berbaring di rumput, menatap awan di langit biru dan berimajinasi.",
    "Close-up tangan sedang membuat gerabah di atas roda tembikar.",
    "Melihat ke luar jendela kereta api saat pemandangan berlalu dengan cepat.",
    "Melepaskan lampion terbang ke langit malam saat festival.",
    "Seorang anak kecil mengejar merpati di alun-alun kota yang megah.",
    "Seorang seniman tua melukis di studionya yang berantakan dan penuh cahaya.",
    "Menjelajahi bangkai kapal karam di bawah laut yang biru jernih.",
    "Tangan membuka buku tua berdebu di perpustakaan yang sunyi.",
    "Berdiri di dalam rumah kaca raksasa yang penuh dengan tanaman eksotis.",
    "Bayangan seseorang menari di dinding yang diterangi api unggun.",
    // --- Tambahan Lama ---
    "Tangan seorang perajin perak sedang mengukir detail rumit.",
    "Seorang peramal melihat ke dalam bola kristal di ruangan yang remang-remang.",
    "Menyelam ke dalam kolam renang di malam hari, dilihat dari bawah air.",
    "Merakit sebuah model kapal di dalam botol dengan sangat teliti.",
    "Seorang DJ memainkan piringan hitam di sebuah klub bawah tanah yang ramai.",
    "Membuat sketsa pemandangan kota di buku catatan dari jendela apartemen.",
    // --- Tambahan Baru ---
    "Close-up gelembung sabun raksasa yang pecah dalam gerakan lambat.",
    "Seorang anak menekan wajahnya ke kaca toko kue, matanya berbinar.",
    "Tangan seorang kaligrafer menulis dengan tinta emas di atas kertas perkamen hitam.",
    "Bayangan kincir angin raksasa berputar di atas ladang tulip.",
    "Menerbangkan layang-layang naga tradisional di pantai berangin.",
];


const ControlDropdown = ({ label, value, onChange, options }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-400">{label}</label>
        <select value={value} onChange={onChange} className="bg-gray-700 text-white text-sm rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const App: React.FC = () => {
    // Control State
    const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]);
    const [subject, setSubject] = useState(subjects[0]);
    const [age, setAge] = useState('25');
    const [time, setTime] = useState(times[2]);
    const [posture, setPosture] = useState(postures[1]);
    const [body, setBody] = useState(bodies[0]);
    const [resolution, setResolution] = useState(resolutions[4]);
    const [clothing, setClothing] = useState(clothingOptions[0]);
    const [cameraAngle, setCameraAngle] = useState(cameraOptions[0]);
    const [faceReferenceImage, setFaceReferenceImage] = useState<File | null>(null);
    const [facePreview, setFacePreview] = useState<string | null>(null);
    const [faceSimilarity, setFaceSimilarity] = useState(faceSimilarityOptions[0]);
    const [clothingReferenceImage, setClothingReferenceImage] = useState<File | null>(null);
    const [clothingPreview, setClothingPreview] = useState<string | null>(null);
    const [productReferenceImage, setProductReferenceImage] = useState<File | null>(null);
    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [motorcycleReferenceImage, setMotorcycleReferenceImage] = useState<File | null>(null);
    const [motorcyclePreview, setMotorcyclePreview] = useState<string | null>(null);
    const [isDetectingGender, setIsDetectingGender] = useState(false);


    // Storyboard State
    const [plantationScene, setPlantationScene] = useState(cinematicPlantationOptions[0]);
    const [mountainScene, setMountainScene] = useState(cinematicMountainOptions[0]);
    const [urbanScene, setUrbanScene] = useState(cinematicUrbanOptions[0]);
    const [fishingScene, setFishingScene] = useState(cinematicFishingOptions[0]);
    const [beachScene, setBeachScene] = useState(cinematicBeachOptions[0]);
    const [petCatScene, setPetCatScene] = useState(cinematicPetCatOptions[0]);
    const [productFlexingScene, setProductFlexingScene] = useState(cinematicProductFlexingOptions[0]);
    const [costumeSelection, setCostumeSelection] = useState(NONE_OPTION);
    const [costumeScene, setCostumeScene] = useState('');
    const [miscScene, setMiscScene] = useState(cinematicMiscOptions[0]);
    const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
    const [storyGenerated, setStoryGenerated] = useState(false);
    const [socialMediaPackage, setSocialMediaPackage] = useState<SocialMediaPackage | null>(null);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);


    const [scenes, setScenes] = useState<Scene[]>([...Array(9)].map((_, i) => ({ 
        id: i + 1, 
        prompt: '', 
        generatedImageUrl: null, 
        isLoading: false 
    })));

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!faceReferenceImage) {
            setFacePreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(faceReferenceImage);
        setFacePreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [faceReferenceImage]);
    
    useEffect(() => {
        if (!clothingReferenceImage) {
            setClothingPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(clothingReferenceImage);
        setClothingPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [clothingReferenceImage]);

    useEffect(() => {
        if (!productReferenceImage) {
            setProductPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(productReferenceImage);
        setProductPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [productReferenceImage]);

    useEffect(() => {
        if (!motorcycleReferenceImage) {
            setMotorcyclePreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(motorcycleReferenceImage);
        setMotorcyclePreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [motorcycleReferenceImage]);

    const handleFaceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFaceReferenceImage(file);
            setIsDetectingGender(true);
            setError(null);
    
            try {
                const detectedGender = await analyzeImageForGender(file);
                // Ensure the detected gender is a valid option before setting it
                if (subjects.includes(detectedGender)) {
                    setSubject(detectedGender);
                }
            } catch (err) {
                console.error(err);
                // Optionally set an error message for the user, but for now, we just log it.
                // The user can still select the subject manually.
            } finally {
                setIsDetectingGender(false);
            }
        }
    };
    
    const handleClothingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setClothingReferenceImage(e.target.files[0]);
        }
    };

    const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProductReferenceImage(e.target.files[0]);
        }
    };
    
    const handleMotorcycleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setMotorcycleReferenceImage(e.target.files[0]);
        }
    };

    const handlePromptChange = (sceneId: number, newPrompt: string) => setScenes(p => p.map(s => s.id === sceneId ? { ...s, prompt: newPrompt } : s));

    const handleGeneratePrompts = async () => {
        setIsGeneratingPrompts(true);
        setStoryGenerated(false);
        setSocialMediaPackage(null);
        setError(null);
        setScenes(s => s.map(scene => ({...scene, generatedImageUrl: null})));

        try {
            const contextLines: string[] = [];
            
            // Section 1: Core Visual Directives
            contextLines.push('**Parameter Utama Cerita:**');
            contextLines.push(`- Rasio Aspek: ${aspectRatio}`);
            contextLines.push(`- Kualitas Gambar: ${resolution}`);
            contextLines.push(`- Subjek Utama: ${subject}`);
            contextLines.push(`- Usia Subjek: ${age} tahun`);
            contextLines.push(`- Waktu Cerita: ${time}`);
            contextLines.push(`- Postur Subjek: ${posture}`);
            contextLines.push(`- Bentuk Badan Subjek: ${body}`);
            contextLines.push(`- Pakaian Spesifik: ${clothing === clothingOptions[0] ? 'Belum ditentukan, AI harus memilih yang sesuai dengan cerita.' : clothing}`);
            contextLines.push(`- Sudut Kamera Konsisten: ${cameraAngle === cameraOptions[0] ? 'AI harus memilih sudut kamera sinematik terbaik untuk setiap adegan.' : cameraAngle}`);

            // Section 2: Image References
            contextLines.push('\n**Referensi Gambar yang Digunakan:**');
            if (faceReferenceImage) {
                contextLines.push(`- Referensi Wajah: Ya, dengan tingkat kemiripan '${faceSimilarity}'. Wajah subjek harus konsisten menyerupai gambar ini di semua adegan.`);
            } else {
                contextLines.push('- Referensi Wajah: Tidak ada.');
            }
            if (productReferenceImage) {
                contextLines.push('- Referensi Produk: Ya, produk dalam gambar ini harus menjadi fokus atau elemen penting dalam cerita.');
            } else {
                contextLines.push('- Referensi Produk: Tidak ada.');
            }
            if (clothingReferenceImage) {
                contextLines.push('- Referensi Pakaian: Ya, subjek harus mengenakan pakaian yang sama atau sangat mirip dengan gambar referensi ini di semua adegan.');
            } else {
                contextLines.push('- Referensi Pakaian: Tidak ada.');
            }
            if (motorcycleReferenceImage) {
                contextLines.push('- Referensi Motor: Ya, motor dalam gambar ini harus menjadi elemen penting dalam cerita, digunakan oleh subjek.');
            } else {
                contextLines.push('- Referensi Motor: Tidak ada.');
            }


            const inspirationDetails = [
                { label: 'Perkebunan', value: plantationScene },
                { label: 'Outdoor', value: mountainScene },
                { label: 'Dalam Kota', value: urbanScene },
                { label: 'Memancing', value: fishingScene },
                { label: 'Pantai', value: beachScene },
                { label: 'Kucing Peliharaan', value: petCatScene },
                { label: 'Pose Iklan Produk', value: productFlexingScene },
                { label: 'Kostum', value: costumeScene },
                { label: 'Lainnya', value: miscScene },
            ];
    
            const selectedInspirations = inspirationDetails
                .filter(item => item.value && item.value !== NONE_OPTION)
                .map(item => `- ${item.label}: ${item.value}`);

            const generalContext = contextLines.join('\n');
            const inspirationContext = selectedInspirations.length > 0
                ? `\n**Inspirasi Cerita yang Harus Dirangkai:**\n${selectedInspirations.join('\n')}`
                : '\n**Inspirasi Cerita:** Tidak ada yang dipilih, buat cerita orisinal berdasarkan parameter utama.';

            const finalContextForAI = `${generalContext}${inspirationContext}`;

            const generatedPrompts = await generateStorylinePrompts(finalContextForAI);
            setScenes(currentScenes => currentScenes.map((scene, index) => ({
                ...scene,
                prompt: generatedPrompts[index] || ''
            })));
            setStoryGenerated(true);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Gagal menghasilkan prompt cerita.');
        } finally {
            setIsGeneratingPrompts(false);
        }
    };

    const handleGenerateStory = async () => {
        setIsGeneratingStory(true);
        setSocialMediaPackage(null);
        setError(null);

        const prompts = scenes.map(s => s.prompt).filter(p => p.trim() !== '');
        if (prompts.length < 9) {
            setError("Harus ada 9 prompt adegan untuk menghasilkan cerita.");
            setIsGeneratingStory(false);
            return;
        }

        try {
            const storyPackage = await generateSocialMediaPackage(prompts);
            setSocialMediaPackage(storyPackage);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Gagal menghasilkan cerita media sosial.');
        } finally {
            setIsGeneratingStory(false);
        }
    };

    const handleGenerateImage = async (sceneId: number) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene || !scene.prompt.trim()) {
            setError(`Tuliskan prompt untuk Adegan ${sceneId} terlebih dahulu.`);
            return;
        }

        setScenes(p => p.map(s => s.id === sceneId ? { ...s, isLoading: true, generatedImageUrl: null } : s));
        setError(null);

        try {
            let workingPrompt = scene.prompt;

            // Failsafe: Remove the SoundFX part, as it's irrelevant for image generation.
            const soundFxIndex = workingPrompt.toLowerCase().indexOf('soundfx:');
            if (soundFxIndex !== -1) {
                workingPrompt = workingPrompt.substring(0, soundFxIndex).trim();
            }

            // Build the final prompt with helpful directives.
            const directives = [];
            
            // 1. Always add the aspect ratio directive explicitly.
            directives.push(`Rasio aspek ${aspectRatio.split(' ')[0]}.`);
            
            // 2. Add camera angle directive if a specific one is chosen.
            if (cameraAngle !== cameraOptions[0]) {
                directives.push(cameraAngle);
            }
            
            const finalPrompt = `${directives.join(' ')} ${workingPrompt}`;

            const imageUrl = await generateImageFromPrompt(finalPrompt, aspectRatio, faceReferenceImage, clothingReferenceImage, productReferenceImage, motorcycleReferenceImage);
            setScenes(p => p.map(s => s.id === sceneId ? { ...s, generatedImageUrl: imageUrl } : s));
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : `Gagal menghasilkan gambar untuk Adegan ${sceneId}.`);
        } finally {
            setScenes(p => p.map(s => s.id === sceneId ? { ...s, isLoading: false } : s));
        }
    };
    
    const subjectLabel = isDetectingGender ? "Subjek (Mendeteksi...)" : "Subjek";

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <main className="container mx-auto px-4 py-8">
                <header className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 mb-3">
                        AI Image Scene Generator
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg text-gray-400 leading-relaxed">
                        Buat gambar yang menakjubkan dari teks. Rancang alur cerita sinematik di sembilan adegan dengan kontrol kreatif terperinci atas subjek, pencahayaan, pakaian, dan lainnya.
                    </p>
                </header>

                <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl mb-8 shadow-lg border border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
                        <ControlDropdown label="Rasio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} options={aspectRatios} />
                        <ControlDropdown label={subjectLabel} value={subject} onChange={e => setSubject(e.target.value)} options={subjects} />
                        <ControlDropdown label="Umur" value={age} onChange={e => setAge(e.target.value)} options={ageOptions} />
                        <ControlDropdown label="Waktu" value={time} onChange={e => setTime(e.target.value)} options={times} />
                        <ControlDropdown label="Postur" value={posture} onChange={e => setPosture(e.target.value)} options={postures} />
                        <ControlDropdown label="Badan" value={body} onChange={e => setBody(e.target.value)} options={bodies} />
                        <ControlDropdown label="Resolusi" value={resolution} onChange={e => setResolution(e.target.value)} options={resolutions} />
                        <ControlDropdown label="Pakaian" value={clothing} onChange={e => setClothing(e.target.value)} options={clothingOptions} />
                        <ControlDropdown label="Kamera Cinematic" value={cameraAngle} onChange={e => setCameraAngle(e.target.value)} options={cameraOptions} />
                    </div>
                </div>
                 <p className="text-center text-xs text-gray-500 -mt-6 mb-8">
                    AI akan menjaga konsistensi pakaian, aksesoris, gaya rambut, penutup kepala, latar belakang, pencahayaan, dan color grading di semua adegan.
                </p>
                
                 <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl mb-8 shadow-lg border border-gray-700">
                    <div className="grid grid-cols-2 lg:grid-cols-4 items-start gap-8">
                        {/* Face Reference */}
                        <div className="flex flex-col items-center justify-center gap-4 w-full">
                             <label className="text-sm font-semibold text-gray-300">Referensi Wajah (Opsional):</label>
                            {!facePreview ? (
                                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm w-full text-center">
                                    <span>Unggah Foto Wajah</span>
                                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFaceImageChange} />
                                </label>
                            ) : (
                                <div className="flex flex-col items-center gap-4 w-full">
                                    <div className="flex items-center gap-4">
                                        <img src={facePreview} alt="Face Preview" className="h-14 w-14 rounded-full object-cover border-2 border-purple-500" />
                                        <button onClick={() => setFaceReferenceImage(null)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                            Hapus
                                        </button>
                                    </div>
                                    <div className="w-full">
                                        <ControlDropdown
                                            label="Kemiripan Wajah"
                                            value={faceSimilarity}
                                            onChange={e => setFaceSimilarity(e.target.value)}
                                            options={faceSimilarityOptions}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Clothing Reference */}
                         <div className="flex flex-col items-center justify-center gap-4 w-full">
                             <label className="text-sm font-semibold text-gray-300">Referensi Pakaian (Opsional):</label>
                            {!clothingPreview ? (
                                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm w-full text-center">
                                    <span>Unggah Foto Pakaian</span>
                                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleClothingImageChange} />
                                </label>
                            ) : (
                                 <div className="flex items-center gap-4">
                                    <img src={clothingPreview} alt="Clothing Preview" className="h-14 w-14 rounded-lg object-cover border-2 border-purple-500" />
                                    <button onClick={() => setClothingReferenceImage(null)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Product Reference */}
                        <div className="flex flex-col items-center justify-center gap-4 w-full">
                             <label className="text-sm font-semibold text-gray-300">Referensi Produk (Opsional):</label>
                            {!productPreview ? (
                                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm w-full text-center">
                                    <span>Unggah Foto Produk</span>
                                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleProductImageChange} />
                                </label>
                            ) : (
                                 <div className="flex items-center gap-4">
                                    <img src={productPreview} alt="Product Preview" className="h-14 w-14 rounded-lg object-cover border-2 border-purple-500" />
                                    <button onClick={() => setProductReferenceImage(null)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Motorcycle Reference */}
                        <div className="flex flex-col items-center justify-center gap-4 w-full">
                             <label className="text-sm font-semibold text-gray-300">Referensi Motor (Opsional):</label>
                            {!motorcyclePreview ? (
                                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm w-full text-center">
                                    <span>Unggah Foto Motor</span>
                                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleMotorcycleImageChange} />
                                </label>
                            ) : (
                                 <div className="flex items-center gap-4">
                                    <img src={motorcyclePreview} alt="Motorcycle Preview" className="h-14 w-14 rounded-lg object-cover border-2 border-purple-500" />
                                    <button onClick={() => setMotorcycleReferenceImage(null)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                 <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl mb-8 shadow-lg border border-gray-700">
                    <h2 className="text-lg font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        Cinematic Cerita (Opsional)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ControlDropdown label="Perkebunan" value={plantationScene} onChange={e => setPlantationScene(e.target.value)} options={cinematicPlantationOptions} />
                        <ControlDropdown label="Outdoor" value={mountainScene} onChange={e => setMountainScene(e.target.value)} options={cinematicMountainOptions} />
                        <ControlDropdown label="Dalam Kota" value={urbanScene} onChange={e => setUrbanScene(e.target.value)} options={cinematicUrbanOptions} />
                        <ControlDropdown label="Memancing" value={fishingScene} onChange={e => setFishingScene(e.target.value)} options={cinematicFishingOptions} />
                        <ControlDropdown label="Pantai" value={beachScene} onChange={e => setBeachScene(e.target.value)} options={cinematicBeachOptions} />
                        <ControlDropdown label="Kucing Peliharaan" value={petCatScene} onChange={e => setPetCatScene(e.target.value)} options={cinematicPetCatOptions} />
                        <ControlDropdown label="Pose Iklan Produk" value={productFlexingScene} onChange={e => setProductFlexingScene(e.target.value)} options={cinematicProductFlexingOptions} />
                        <div>
                            <ControlDropdown 
                                label="Kostum" 
                                value={costumeSelection} 
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    setCostumeSelection(newValue);
                                    if (newValue === NONE_OPTION) {
                                        setCostumeScene('');
                                    }
                                }} 
                                options={costumeOptions} 
                            />
                            {costumeSelection === 'Tulis Manual' && (
                                <input
                                    type="text"
                                    value={costumeScene}
                                    onChange={(e) => setCostumeScene(e.target.value)}
                                    placeholder="e.g., Armor ksatria, jaket kulit, dll."
                                    className="w-full bg-gray-700 text-white text-sm rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-2"
                                    aria-label="Deskripsi Kostum Manual"
                                />
                            )}
                        </div>
                        <ControlDropdown label="Lainnya" value={miscScene} onChange={e => setMiscScene(e.target.value)} options={cinematicMiscOptions} />
                    </div>
                </div>

                <div className="text-center mb-8 flex flex-col items-center gap-4">
                    <button
                        onClick={handleGeneratePrompts}
                        disabled={isGeneratingPrompts}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-lg w-full max-w-xs"
                    >
                        {isGeneratingPrompts ? <Loader text="Mencari Ide..." /> : 'Hasilkan Cerita Sinematik (Awal-Akhir)'}
                    </button>
                    {storyGenerated && (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-xl">
                            <button
                                onClick={handleGenerateStory}
                                disabled={isGeneratingStory}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-lg w-full md:w-auto flex-1"
                            >
                                {isGeneratingStory ? <Loader text="Menulis Cerita..." /> : 'Hasilkan Cerita Medsos'}
                            </button>
                        </div>
                    )}
                </div>
                
                {storyGenerated && !socialMediaPackage && (
                  <div className="mb-8">
                    <StoryPreview scenes={scenes} />
                  </div>
                )}
                
                {socialMediaPackage && (
                     <div className="mb-8 max-w-3xl mx-auto">
                        <StorytellingOutput content={socialMediaPackage} />
                    </div>
                )}


                {error && (
                    <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative text-center my-4 max-w-3xl mx-auto" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scenes.map(scene => (
                        <div key={scene.id} className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 flex flex-col gap-4">
                            <h2 className="text-xl font-semibold text-center text-purple-300">Adegan {scene.id}</h2>
                            <AnalysisPanel prompt={scene.prompt} onPromptChange={p => handlePromptChange(scene.id, p)} />
                            <button onClick={() => handleGenerateImage(scene.id)} disabled={!scene.prompt.trim() || scene.isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors">
                                {scene.isLoading ? <Loader text="Menghasilkan..." /> : 'Hasilkan Gambar'}
                            </button>
                            {scene.generatedImageUrl && (
                                <GeneratedImage imageUrl={scene.generatedImageUrl} prompt={scene.prompt} onRegenerate={() => handleGenerateImage(scene.id)} />
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default App;
