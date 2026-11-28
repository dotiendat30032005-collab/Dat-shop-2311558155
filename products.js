// Danh mục sản phẩm thực tế của "Chút Ngọt Quê" – Châu Bình, Giồng Trôm, Bến Tre
// Gồm 3 lựa chọn mứt dừa sợi mỏng sên tay truyền thống và 3 cỡ gói (200g, 500g, 1kg)

window.PACK_OPTIONS = [
  {
    id: "200g",
    label: "Gói dùng thử 200g",
    shortLabel: "Gói 200g (Dùng thử)",
    weightText: "200g",
    price: 35000,
    desc: "Nhỏ gọn nhâm nhi thử vị mứt quê"
  },
  {
    id: "500g",
    label: "Gói 500g",
    shortLabel: "Gói 500g",
    weightText: "500g",
    price: 72000,
    desc: "Vừa vặn cho bàn trà gia đình"
  },
  {
    id: "1kg",
    label: "Gói 1kg",
    shortLabel: "Gói 1kg (Tiết kiệm)",
    weightText: "1kg",
    price: 122000,
    desc: "Tiết kiệm nhất • Đãi khách & biếu quà"
  }
];

window.PRODUCT_CATEGORIES = [
  { id: "all", name: "Tất cả sản phẩm", icon: "🥥" },
  { id: "khong-mau", name: "Sợi mỏng không màu", icon: "🤍" },
  { id: "la-dua", name: "Sợi mỏng lá dứa", icon: "🌿" },
  { id: "mix-2-mau", name: "Mix 2 màu", icon: "🎁" }
];

window.PRODUCTS = [
  {
    id: "mut-dua-trang",
    name: "Mứt Dừa Sợi Mỏng Không Màu Sên Tay",
    category: "khong-mau",
    categoryLabel: "Truyền thống không màu",
    description: "Cơm dừa Bến Tre bào sợi mỏng vừa ăn, sên tay thủ công cùng đường cát trắng tinh khiết. Giữ nguyên sắc trắng ngần tự nhiên, sợi mứt khô ráo bám lớp phấn đường mỏng, thơm béo vị dừa quê, không chất tẩy trắng.",
    storageTip: "Cột kín miệng túi sau khi mở; để nơi khô ráo thoáng mát 15–20 ngày hoặc ngăn mát tủ lạnh 30 ngày.",
    origin: "Ấp Bình An, Xã Châu Bình, Giồng Trôm, Bến Tre",
    price: 35000,
    maxPrice: 122000,
    unit: "Tùy chọn gói 200g • 500g • 1kg",
    image: "images/mut-dua-trang-that.jpg",
    imageAlt: "Ảnh thực tế mứt dừa sợi mỏng màu trắng truyền thống sên tay Chút Ngọt Quê",
    isSplitImage: false,
    badge: "Vị nguyên bản",
    accentColor: "#6f4518",
    featured: true
  },
  {
    id: "mut-dua-la-dua",
    name: "Mứt Dừa Sợi Mỏng Màu Lá Dứa Sên Tay",
    category: "la-dua",
    categoryLabel: "Hương lá dứa tươi",
    description: "Sợi dừa mỏng dẻo thơm được ngâm cùng nước cốt lá dứa tươi hái vườn tạo sắc xanh non tự nhiên dịu mắt. Từng mẻ mứt sên lửa nhỏ dậy hương lá dứa thoang thoảng, ngọt thanh không gắt cổ.",
    storageTip: "Tránh ánh nắng trực tiếp để giữ màu xanh tự nhiên của lá dứa; ngon tuyệt khi nhâm nhi cùng trà nóng.",
    origin: "Ấp Bình An, Xã Châu Bình, Giồng Trôm, Bến Tre",
    price: 35000,
    maxPrice: 122000,
    unit: "Tùy chọn gói 200g • 500g • 1kg",
    image: "images/mut-dua-la-dua-that.jpg",
    imageAlt: "Ảnh thực tế mứt dừa sợi mỏng màu xanh lá dứa tự nhiên sên tay Chút Ngọt Quê",
    isSplitImage: false,
    badge: "Thơm lá dứa vườn",
    accentColor: "#14532d",
    featured: true
  },
  {
    id: "mut-dua-mix-2-mau",
    name: "Mứt Dừa Sợi Mỏng Mix 2 Màu Sên Tay (Trắng & Lá Dứa)",
    category: "mix-2-mau",
    categoryLabel: "Mix 2 vị truyền thống & lá dứa",
    description: "Sự kết hợp hài hòa giữa mứt dừa sợi mỏng trắng truyền thống béo bùi và mứt dừa màu lá dứa thơm mát trong cùng một gói. Tiện lợi để thưởng thức trọn vẹn cả hai hương vị quê nhà hoặc bày đĩa đãi khách.",
    storageTip: "Bảo quản nơi thoáng mát khô ráo 15–20 ngày, đóng kín túi sau mỗi lần dùng để sợi mứt luôn ráo đường.",
    origin: "Ấp Bình An, Xã Châu Bình, Giồng Trôm, Bến Tre",
    price: 35000,
    maxPrice: 122000,
    unit: "Tùy chọn gói 200g • 500g • 1kg",
    image: "images/mut-dua-mix-that.jpg",
    splitImages: [
      "images/mut-dua-trang-that.jpg",
      "images/mut-dua-la-dua-that.jpg"
    ],
    imageAlt: "Khung ảnh kết hợp 2 vị mứt dừa sợi mỏng trắng truyền thống và xanh lá dứa sên tay",
    isSplitImage: true,
    badge: "Được chọn nhiều",
    accentColor: "#9a3412",
    featured: true
  }
];
