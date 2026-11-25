// Danh sách 8 sản phẩm đặc sản Bến Tre của cửa hàng "Đạt Xứ Dừa" (Châu Bình – Giồng Trôm)
// Chia làm 2 nhóm: "mut-dua" (Mứt dừa) và "dua-trai" (Dừa trái tươi: dừa xiêm xanh & dừa xiêm đỏ)

window.PRODUCT_CATEGORIES = [
  { id: "all", name: "Tất cả sản phẩm", icon: "🌾" },
  { id: "mut-dua", name: "Mứt dừa Bến Tre", icon: "🥥" },
  { id: "dua-trai", name: "Dừa trái tươi (Xiêm xanh & Đỏ)", icon: "🌴" }
];

window.PRODUCTS = [
  {
    id: "md-sua-tuoi",
    name: "Mứt dừa non sữa tươi truyền thống (500g)",
    category: "mut-dua",
    categoryLabel: "Mứt dừa Bến Tre",
    description: "Sợi dừa non dẻo mềm chọn lọc tại Châu Bình – Giồng Trôm, sên tay cùng sữa tươi ít ngọt, thơm béo tự nhiên không chất bảo quản.",
    price: 120000,
    unit: "Gói 500g hút chân không",
    image: "images/md-sua-tuoi.jpg",
    imageAlt: "Mẹc tre mứt dừa non sữa tươi trắng ngà dẻo mềm bên trái dừa tươi Bến Tre",
    badge: "Bán chạy nhất",
    accentColor: "#7c3f06"
  },
  {
    id: "md-la-dua",
    name: "Mứt dừa non lá dứa dẻo thơm (500g)",
    category: "mut-dua",
    categoryLabel: "Mứt dừa Bến Tre",
    description: "Màu xanh lá mạ dịu mắt ép từ lá dứa tươi vườn nhà Châu Bình – Giồng Trôm, sợi mứt dẻo mềm, thơm thoang thoảng hương quê.",
    price: 130000,
    unit: "Gói 500g hút chân không",
    image: "images/md-la-dua.jpg",
    imageAlt: "Mứt dừa non lá dứa màu xanh tự nhiên bày trên mẹt tre lót lá chuối",
    badge: "Hương lá dứa vườn",
    accentColor: "#14532d"
  },
  {
    id: "md-sau-rieng",
    name: "Mứt dừa non sầu riêng Bến Tre (500g)",
    category: "mut-dua",
    categoryLabel: "Mứt dừa Bến Tre",
    description: "Quyện cơm dừa non dẻo béo với thịt sầu riêng chín cây miền Tây vàng ươm, đóng hộp lịch sự thích hợp biếu tặng người thân.",
    price: 155000,
    unit: "Hộp 500g quà biếu",
    image: "images/md-sau-rieng.jpg",
    imageAlt: "Mứt dừa non vị sầu riêng vàng kem béo ngậy trên khay gỗ mộc",
    badge: "Đặc sản loại 1",
    accentColor: "#78350f"
  },
  {
    id: "md-ca-phe",
    name: "Mứt dừa non vị cà phê muối (500g)",
    category: "mut-dua",
    categoryLabel: "Mứt dừa Bến Tre",
    description: "Hương cà phê phin rang mộc quyện chút muối biển mặn dịu tôn lên vị bùi béo của cùi dừa non, nhâm nhi trà nóng rất bắt vị.",
    price: 135000,
    unit: "Gói 500g hút chân không",
    image: "images/md-ca-phe.jpg",
    imageAlt: "Đĩa mứt dừa non vị cà phê muối nâu trầm cạnh phin cà phê truyền thống",
    badge: "Vị mới lạ miệng",
    accentColor: "#5c3317"
  },
  {
    id: "dt-xiem-xanh-5",
    name: "Lốc 5 trái dừa xiêm xanh gọt trọc",
    category: "dua-trai",
    categoryLabel: "Dừa trái tươi",
    description: "Dừa xiêm xanh Châu Bình – Giồng Trôm gọt sạch vỏ xơ còn lớp gáo trắng ngần mát lạnh, khui nhẹ cắm ống hút tre uống liền.",
    price: 85000,
    unit: "Lốc 5 trái (tặng kèm ống hút)",
    image: "images/dt-xiem-xanh-5.jpg",
    imageAlt: "Lốc 5 trái dừa xiêm xanh gọt trọc trắng ngần đọng sương mát lạnh kèm ống hút tre",
    badge: "Khui uống liền",
    accentColor: "#0f5132"
  },
  {
    id: "dt-xiem-xanh-10",
    name: "Thùng 10 trái dừa xiêm xanh Bến Tre",
    category: "dua-trai",
    categoryLabel: "Dừa trái tươi",
    description: "Dừa xiêm xanh nguyên vỏ hái mới trong ngày tại vườn Giồng Trôm, giữ tươi tự nhiên đến 14 ngày, nước ngọt thanh mát lành.",
    price: 160000,
    unit: "Thùng 10 trái nguyên vỏ",
    image: "images/dt-xiem-xanh-10.jpg",
    imageAlt: "Giỏ tre 10 trái dừa xiêm xanh nguyên vỏ tươi hái tại vườn dừa Bến Tre",
    badge: "Tiết kiệm",
    accentColor: "#14532d"
  },
  {
    id: "dt-xiem-do-5",
    name: "Lốc 5 trái dừa xiêm đỏ (xiêm lửa) ngọt đậm",
    category: "dua-trai",
    categoryLabel: "Dừa trái tươi",
    description: "Giống dừa xiêm lửa vỏ đỏ cam rực rỡ đặc sản Châu Bình – Giồng Trôm, trái đầy nước, vị ngọt sâu và cơm dừa dẻo thơm.",
    price: 95000,
    unit: "Lốc 5 trái tươi hái vườn",
    image: "images/dt-xiem-do-5.jpg",
    imageAlt: "5 trái dừa xiêm đỏ vỏ cam đỏ rực rỡ kèm trái khui sẵn cắm ống hút tre",
    badge: "Dừa xiêm lửa",
    accentColor: "#9a3412"
  },
  {
    id: "dt-xiem-do-10",
    name: "Thùng 10 trái dừa xiêm đỏ tuyển chọn",
    category: "dua-trai",
    categoryLabel: "Dừa trái tươi",
    description: "Tuyển chọn từng buồng dừa xiêm đỏ loại 1 tại nhà vườn Châu Bình – Giồng Trôm, màu vỏ đỏ cam may mắn đẹp mắt để đãi tiệc, biếu quà.",
    price: 180000,
    unit: "Thùng 10 trái tuyển chọn",
    image: "images/dt-xiem-do-10.jpg",
    imageAlt: "Thùng gỗ mộc 10 trái dừa xiêm đỏ Bến Tre tuyển chọn nguyên cuống tươi rói",
    badge: "Quà biếu miền Tây",
    accentColor: "#7c2d12"
  }
];
