const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Visitor = require("./models/visitorSchema");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const Admin = require("./models/admin");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Product = require("./models/productSchema");
const Customer = require("./models/customerSchema");
const Order = require("./models/orderSchema");
const Sell = require("./models/sellSchema");
const Section = require("./models/sectionSchema");
const About = require("./models/aboutSchema");
const moment = require("moment");
var methodOverride = require("method-override");
require("dotenv").config();
const { render } = require("ejs");
const router = require("express").Router();

const PORT = process.env.PORT || 4000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------- إعداد Multer + Cloudinary ----------
const sectionsStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sections",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const uploadSections = multer({ storage: sectionsStorage });

const productsStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const uploadProducts = multer({ storage: productsStorage });

const aboutStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "about",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadAbout = multer({ storage: aboutStorage });

const sellStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sections",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const uploadSell = multer({ storage: sellStorage });

const adminStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "admins",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const uploadAdmin = multer({ storage: adminStorage });

const customerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const uploadCustomers = multer({ storage: customerStorage });

// ---------- init ----------
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.json());

app.engine("html", require("ejs").renderFile);
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.json());

// ---------- اتصال Mongo ----------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log("✅ Server running on", PORT));
  })
  .catch((err) => console.error("MongoDB conn error:", err));

//------Middleware----------
app.use(async (req, res, next) => {
  try {
    const sections = await Section.find({}).lean();
    res.locals.homeData = { sections: sections || [] };
  } catch (err) {
    console.log("Error loading Home sections:", err);
    res.locals.homeData = { sections: [] };
  }
  next();
});

//create initial Admin
(async () => {
  try {
    const email = process.env.ADMIN_INITIAL_EMAIL;
    if (!email)
      return console.warn(
        "No ADMIN_INITIAL_EMAIL in .env, skipping initial admin creation."
      );

    const existing = await Admin.findOne({ email });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD, salt);
      const admin = new Admin({
        name: process.env.ADMIN_INITIAL_NAME || "Admin",
        email,
        passwordHash: hash,
      });
      await admin.save();
      console.log("Initial admin created:", email);
    } else {
      console.log("Initial admin already exists:", email);
    }
  } catch (e) {
    console.error("Error creating initial admin:", e);
  }
})();

function signToken(admin) {
  const payload = { id: admin._id, email: admin.email, name: admin.name };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

async function ensureAdmin(req, res, next) {
  try {
    const token = req.cookies["admin_token"]; // هنخزن التوكين في كوكي باسم admin_token
    if (!token) return res.redirect("/admin");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      res.clearCookie("admin_token");
      return res.redirect("admin");
    }
    // ضيف بيانات الادمن للـ req للوصول في الراوتات
    req.admin = admin;
    next();
  } catch (err) {
    // توكن انتهى أو غير صالح
    res.clearCookie("admin_token");
    return res.redirect("admin");
  }
}

app.use(async (req, res, next) => {
  try {
    // الحصول على IP الزائر
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // تخزين الزيارة
    await Visitor.create({ ip });
  } catch (err) {
    console.error("Error saving visitor:", err);
  }
  next();
});
//--------------Cart------------------
// let cart = [];

app.use((req, res, next) => {
  if (!req.session.cart) req.session.cart = [];
  next();
});

function renderCart(cartArray) {
  let html = "",
    total = 0;
  cartArray.forEach((item) => {
    total += Number(item.priceAfterDiscount) * item.qty;

    html += `
    <article class="cart__card">
      <div class="cart__box">
        <img src="${item.image}" class="cart__img">
      </div>

      <div class="cart__details">
        <h3 class="cart__title">${item.name}</h3>
        <span class="cart__price">${item.priceAfterDiscount} LE</span>

        <div class="cart__amount">
          <div class="cart__amount-content">
            <span class="cart__amount-box minus" data-id="${item.id}">
              <i class='bx bx-minus'></i>
            </span>
            <span class="cart__amount-number">${item.qty}</span>

            <span class="cart__amount-box plus" data-id="${item.id}">
              <i class='bx bx-plus'></i>
            </span>
          </div>

          <i class='bx bx-trash-alt delete btn' data-id="${item.id}"></i>
        </div>
      </div>
    </article>`;
  });

  return { html, total };
}

//------Home---------
app.get("/", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  const sections = await Section.find({});
  const aboutArr = await About.find({});
  const about = aboutArr[0] || {};
  const sell = await Sell.find({});
  const sellim = sell[0] || {};

  res.render("index", {
    arr: products,
    currentPage: "index",
    sec: sections,
    about,
    sell: sellim,
  });
});

//-----------form Page -----GET-----
app.get("/form.html", async (req, res) => {
  const cart = req.session.cart || [];
  // const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const result = renderCart(req.session.cart);
  // res.json({ html: result.html, total: result.total.toFixed(2) });

  res.render("form", { cart, total: result.total.toFixed(2) });
});

app.get("/admin.html", (req, res) => {
  if (req.cookies["admin_token"]) return res.redirect("/dashboard.html");
  res.render("admin", { error: null, message: null });
});

app.get("/admin/logout.html", (req, res) => {
  // مسح الكوكيز
  res.clearCookie("admin_token");
  // إعادة توجيه لصفحة تسجيل الدخول
  res.redirect("admin.html", { message: null });
});
//-----Admin Account-------
app.get("/adminaccount.html", ensureAdmin, (req, res) => {
  res.render("adminaccount", {
    admin: req.admin,
    message: null,
    error: null,
    currentPage: "adminaccount",
  });
});

//-------dashboard---------
app.get("/dashboard.html", ensureAdmin, async (req, res) => {
  try {
    const today = new Date();
    const year = new Date().getFullYear();
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },
      { $unwind: "$products" }, // نفك المصفوفة عشان كل منتج يبقى سجل لوحده
      {
        $group: {
          _id: { $month: "$createdAt" }, // الشهر (1=يناير ... 12=ديسمبر)
          total: {
            $sum: {
              $multiply: ["$products.priceAfterDiscount", "$products.qty"],
            },
          },
        },
      },
      { $sort: { _id: 1 } }, // ترتيب الأشهر من 1 إلى 12
    ]);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );
    const totalProducts = await Product.countDocuments();
    const soldThisMonth = await Sell.countDocuments({
      date: { $gte: startOfMonth, $lte: today },
    });
    const orders = await Order.find()
      .populate("customer") // يجيب بيانات العميل كاملة
      .populate("products.productId"); //
    // جلب الطلبات خلال الشهر
    await Customer.deleteMany({ createdAt: { $lt: new Date("2025-12-12") } });

    const monthlyOrders = await Order.find({
      createdAt: { $gte: startOfMonth, $lt: endOfDay },
    });
    const customersCount = await Customer.countDocuments();
    const revenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenue[0]?.total || 0;
    const ordersCount = await Order.countDocuments();

    // جلب عدد العملاء لكل محافظة
    const customersByRegion = await Customer.aggregate([
      {
        $group: {
          _id: "$governorate",
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$count" }, // إجمالي العملاء
          regions: { $push: { region: "$_id", count: "$count" } },
        },
      },
      { $unwind: "$regions" },
      {
        $project: {
          _id: 0,
          region: "$regions.region",
          count: "$regions.count",
          percentage: {
            $multiply: [{ $divide: ["$regions.count", "$total"] }, 100],
          },
        },
      },
      { $sort: { percentage: -1 } }, // ترتيب حسب النسبة
    ]);

    console.log(customersByRegion);

    // عد المنتجات
    const productStats = {}; // key = productId, value = { name, totalQty }
    monthlyOrders.forEach((order) => {
      order.products.forEach((p) => {
        if (!productStats[p.productId]) {
          productStats[p.productId] = { name: p.name, totalQty: 0 };
        }
        productStats[p.productId].totalQty += p.qty;
      });
    });
    // ترتيب المنتجات حسب الكمية المباعة
    const sortedProducts = Object.entries(productStats)
      .map(([id, info]) => ({ id, name: info.name, totalQty: info.totalQty }))
      .sort((a, b) => b.totalQty - a.totalQty);

    const count = await Visitor.countDocuments();
    const countToday = await Visitor.countDocuments({
      date: { $gte: new Date().setHours(0, 0, 0, 0) },
    });
    // اعمل array طولها 12 شهر، قيمة صفر لكل شهر
    const monthlyRevenueData = Array(12).fill(0);

    // حط البيانات اللي جت من aggregation
    monthlyRevenue.forEach((m) => {
      monthlyRevenueData[m._id - 1] = m.total; // _id=1 => يناير => index 0
    });

    res.render("dashboard", {
      sortedProducts,
      customersByRegion,
      customersCount,
      ordersCount,
      totalRevenue,
      startOfMonth,
      today,
      currentPage: "dashboard",
      orders,
      admin: req.admin,
      count,
      countToday,
      totalProducts,
      soldThisMonth,
      monthlyRevenueData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("حدث خطأ أثناء جلب الإحصاءات");
  }
});

//--------Settings-----------
app.get("/user/settings.html", ensureAdmin, async (req, res) => {
  const sections = await Section.find({});
  res.render("user/settings", {
    currentPage: "settings",
    sections,
    admin: req.admin,
  });
});

//------About-------GET Request-----
app.get("/user/aboutSettings.html", ensureAdmin, async (req, res) => {
  const aboutArr = await About.find({});
  const about = aboutArr[0] || {};

  res.render("user/aboutSettings", {
    about,
    currentPage: "aboutSettings",
    admin: req.admin,
  });
});

//-------SELL---GET--Request--------
app.get("/user/sell.html", ensureAdmin, async (req, res) => {
  const sell = await Sell.find({});
  const sellim = sell[0] || {};
  res.render("user/sell", {
    sell: sellim,
    currentPage: "sell",
    admin: req.admin,
  });
});

// ---------- صفحة إضافة ----------
app.get("/user/add.html", ensureAdmin, (req, res) => {
  res.render("user/add", { currentPage: "add", admin: req.admin });
});

// ---------- صفحة عرض المنتجات ----------
app.get("/show.html", ensureAdmin, async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  res.render("show", { products, currentPage: "show" });
});

// ------- عرض منتج واحد --------
app.get("/user/:id", ensureAdmin, async (req, res) => {
  const products = await Product.findById(req.params.id).lean();
  res.render("user/view", {
    products,
    moment,
    currentPage: "view",
    admin: req.admin,
  });
});

// -------- Edit product (GET) -----
app.get("/edit/:id", ensureAdmin, async (req, res) => {
  const products = await Product.findById(req.params.id).lean();

  res.render("user/edit", {
    arr: products,
    moment,
    currentPage: "edit",
    admin: req.admin,
  });
});

app.post("/cart/add", async (req, res) => {
  const { id } = req.body;

  const product = await Product.findById(id).lean();

  const { name, priceAfterDiscount } = product;

  if (!req.session.cart) req.session.cart = [];

  let item = req.session.cart.find((p) => String(p.id) === String(id));

  if (!item) {
    req.session.cart.push({
      id,
      name,
      priceAfterDiscount,
      image: product.image[0].url,
      qty: 1,
    });
  } else {
    item.qty++;
  }

  const result = renderCart(req.session.cart);
  res.json({ html: result.html, total: result.total.toFixed(2) });
});

app.post("/cart/plus", (req, res) => {
  const item = req.session.cart.find(
    (p) => String(p.id) === String(req.body.id)
  );
  if (item) item.qty++;

  const result = renderCart(req.session.cart);
  res.json({ html: result.html, total: result.total.toFixed(2) });
});

app.post("/cart/minus", (req, res) => {
  const id = String(req.body.id);
  const item = req.session.cart.find((p) => String(p.id) === id);
  if (item) {
    item.qty--;
    if (item.qty <= 0) {
      req.session.cart = req.session.cart.filter((p) => String(p.id) !== id);
    }
  }
  const result = renderCart(req.session.cart);
  res.json({ html: result.html, total: result.total.toFixed(2) });
});

app.post("/cart/delete", (req, res) => {
  req.session.cart = req.session.cart.filter(
    (p) => String(p.id) !== String(req.body.id)
  );

  const result = renderCart(req.session.cart);
  res.json({ html: result.html, total: result.total.toFixed(2) });
});

app.post("/orders/:id/status", ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  await Order.findByIdAndUpdate(id, { status });
  res.redirect("/dashboard.html"); // غيرها لمسار صفحة الطلبات لديك
});

app.post("/admin.html", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(401).render("admin", { error: "Email أو Password " });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match)
      return res.status(401).render("admin", { error: "Email أو Password " });

    const token = signToken(admin);

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.redirect("/dashboard.html");
  } catch (e) {
    console.error(e);
    res.status(500).render("admin", { error: "حصل خطأ حاول تاني" });
  }
});

// app.post("/user/sell.html" , uploadSell.single("imagesell") , async (req , res) => {
//  await Sell.create({
//      selltitle : req.body.selltitle,
//   imageUrlsell: req.file.path,
//   imagePublicIdsell: req.file.filename
//   });
// res.redirect("/user/sell.html");
// });

app.post(
  "/adminaccount.html",
  uploadAdmin.single("image"),
  ensureAdmin,
  async (req, res) => {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const admin = req.admin;

      if (name) admin.name = name;
      if (email) admin.email = email;

      if (newPassword && newPassword.length > 0) {
        const ok = await bcrypt.compare(
          currentPassword || "",
          admin.passwordHash
        );
        if (!ok)
          return res.render("adminaccount", {
            admin,
            error: "الرقم الحالي غلط",
            message: null,
          });

        const salt = await bcrypt.genSalt(10);
        admin.passwordHash = await bcrypt.hash(newPassword, salt);
      }

      if (req.file) {
        if (admin.imagePublicId) {
          await cloudinary.uploader.destroy(admin.imagePublicId);
        }
        admin.imageUrl = req.file.path;
        admin.imagePublicId = req.file.filename;
      }

      await admin.save();

      const token = signToken(admin);
      res.cookie("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.render("adminaccount", {
        admin,
        message: "تم التحديث بنجاح",
        error: null,
      });
    } catch (e) {
      console.error(e);
      res.render("adminaccount", {
        admin: req.admin,
        message: null,
        error: "حصل خطأ",
      });
    }
  }
);

app.post("/logout", (req, res) => {
  res.clearCookie("admin_token");
  res.redirect("admin");
});

//----------Settings(POST)---------
app.post("/sections", uploadSections.single("image"), async (req, res) => {
  await Section.create({
    smallTitle: req.body.smallTitle,
    bigTitle: req.body.bigTitle,
    name: req.body.name,
    description: req.body.description,
    imageUrl: req.file.path,
    imagePublicId: req.file.filename,
  });
  res.redirect("/user/settings.html");
});

app.post(
  "/user/aboutSettings.html",
  uploadAbout.fields([
    { name: "imagefoam", maxCount: 1 },
    { name: "imagewax", maxCount: 1 },
  ]),
  async (req, res) => {
    const foam = req.files.imagefoam ? req.files.imagefoam[0] : null;
    const wax = req.files.imagewax ? req.files.imagewax[0] : null;
    await About.create({
      aboutfoam: req.body.aboutfoam,
      imageUrlfoam: foam?.path,
      imagePublicIdfoam: foam?.filename,
      aboutwax: req.body.aboutwax,
      imageUrlwax: wax?.path,
      imagePublicIdwax: wax?.filename,
    });
    res.redirect("/user/aboutSettings.html");
  }
);

app.put(
  "/aboutsetting/:id",
  uploadAbout.fields([
    { name: "imagefoam", maxCount: 1 },
    { name: "imagewax", maxCount: 1 },
  ]),
  async (req, res) => {
    const about = await About.findById(req.params.id);

    if (!about) return res.status(404).send("About not found");

    const foam = req.files.imagefoam ? req.files.imagefoam[0] : null;
    const wax = req.files.imagewax ? req.files.imagewax[0] : null;

    about.aboutfoam = req.body.aboutfoam;
    about.aboutwax = req.body.aboutwax;

    if (foam) {
      if (about.imagePublicIdfoam)
        await cloudinary.uploader.destroy(about.imagePublicIdfoam);
      about.imageUrlfoam = foam.path;
      about.imagePublicIdfoam = foam.filename;
    }

    if (wax) {
      if (about.imagePublicIdwax)
        await cloudinary.uploader.destroy(about.imagePublicIdwax);
      about.imageUrlwax = wax.path;
      about.imagePublicIdwax = wax.filename;
    }

    await about.save();
    res.redirect("/user/aboutSettings.html");
  }
);

app.delete("/deleteabout/:id", async (req, res) => {
  const about = await About.findById(req.params.id);
  if (!about) return res.status(404).send("About not found");
  if (about.imagePublicIdfoam)
    await cloudinary.uploader.destroy(about.imagePublicIdfoam);
  if (about.imagePublicIdwax)
    await cloudinary.uploader.destroy(about.imagePublicIdwax);

  await About.findByIdAndDelete(req.params.id);
  res.redirect("/user/aboutSettings.html");
});
//----------Settings(PUT)---------
app.put("/sections/:id", uploadSections.single("image"), async (req, res) => {
  const section = await Section.findById(req.params.id);

  section.smallTitle = req.body.smallTitle;
  section.bigTitle = req.body.bigTitle;
  section.name = req.body.name;
  section.description = req.body.description;

  if (req.file) {
    await cloudinary.uploader.destroy(section.imagePublicId);
    section.imageUrl = req.file.path;
    section.imagePublicId = req.file.filename;
  }

  await section.save();
  res.redirect("/user/settings.html");
});

//----------Settings(DELETE)---------
app.delete("/sections/:id", async (req, res) => {
  const section = await Section.findById(req.params.id);
  await cloudinary.uploader.destroy(section.imagePublicId);
  await Section.findByIdAndDelete(req.params.id);
  res.redirect("/user/settings.html");
});

//----POST-------SEL---------
app.post(
  "/user/sell.html",
  uploadSell.single("imagesell"),
  async (req, res) => {
    await Sell.create({
      selltitle: req.body.selltitle,
      imageUrlsell: req.file.path,
      imagePublicIdsell: req.file.filename,
    });
    res.redirect("/user/sell.html");
  }
);

//---PUT------SEL------
app.put("/sell/:id", uploadSell.single("imagesell"), async (req, res) => {
  try {
    const sell = await Sell.findById(req.params.id);
    if (!sell) return res.status(404).send("Sell item not found");

    sell.selltitle = req.body.selltitle;

    if (req.file) {
      // احفظ الـ publicId القديم قبل التحديث
      const oldPublicId = sell.imagePublicIdsell;

      sell.imageUrlsell = req.file.path;
      sell.imagePublicIdsell = req.file.filename;

      // احذف الصورة القديمة من Cloudinary
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }
    }

    await sell.save();
    res.redirect("/user/sell.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

//-----Add Product-------
app.post("/user/add.html", uploadProducts.single("image"), async (req, res) => {
  try {
    const { name, price, discount, category, description } = req.body;
    if (!req.file) {
      return res.status(400).send("❌ من فضلك ارفع صورة واحدة على الأقل");
    }
    const imageObj = {
      url: req.file.path,
      filename: req.file.filename,
    };
    const priceNum = Number(price);
    const discountNum = Number(discount);
    const discountPrice = discountNum > 0 ? (discountNum / 100) * priceNum : 0;
    const priceAfterDiscount = priceNum - discountPrice;
    const product = new Product({
      name,
      price: priceNum,
      discount: discountNum,
      discountPrice,
      priceAfterDiscount,
      description,
      category,
      image: imageObj,
    });
    await product.save();
    res.redirect("/show.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/reset-statistics", async (req, res) => {
  try {
    await Customer.deleteMany({});
    await Order.deleteMany({});

    res.send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Reset failed");
  }
});

// PUT Request------Edit Product
app.put("/edit/:id", uploadProducts.single("image"), async (req, res) => {
  try {
    const { name, price, discount, category, description } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send("❌ Product not found");
    }
    const priceNum = Number(price);
    const discountNum = Number(discount);
    const discountPrice = discountNum > 0 ? (discountNum / 100) * priceNum : 0;
    const priceAfterDiscount = priceNum - discountPrice;
    const updatedData = {
      name,
      price: priceNum,
      discount: discountNum,
      discountPrice,
      priceAfterDiscount,
      description,
      category,
    };

    if (req.file) {
      updatedData.image = [
        {
          url: req.file.path,
          filename: req.file.filename,
        },
      ];
    } else {
      updatedData.image = product.image;
    }
    await Product.findByIdAndUpdate(req.params.id, updatedData);
    res.redirect("/show.html");
  } catch (err) {
    console.log(" Error Updating Product", err);
    res.status(500).send("Server error");
  }
});

//Delete Product------DELETE REQUEST
app.delete("/delete/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/show.html");
  } catch (err) {
    console.log(err);
    res.status(500).send(" Error deleting product");
  }
});

//------------------------form COD------------------------
app.post("/form.html", uploadCustomers.single("image"), async (req, res) => {
  const { fullname, phone, governorate, address } = req.body;
  const customer = new Customer({
    fullname,
    phone,
    governorate,
    address,
  });
  await customer.save();
  const cart = req.session.cart || [];
  const products = cart.map((item) => ({
    productId: item.id, // لازم يكون ID المنتج
    name: item.name,
    priceAfterDiscount: item.priceAfterDiscount || item.priceAfterDiscount, // لو عندك سعر بعد خصم
    qty: item.qty,
    image: [
      {
        url: item.image,
        filename: "productImage",
      },
    ],
  }));

  const totalPrice = products.reduce(
    (sum, p) => sum + p.priceAfterDiscount * p.qty,
    0
  );
  const newOrder = new Order({
    customer: customer._id,
    products,
    totalPrice,
  });
  await newOrder.save();
  const orders = await Order.find()
    .populate("customer")
    .populate("products.productId");
  console.log(orders);
  res.redirect("/form.html");
});

app.post("/orders/delete/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard.html"); // ارجع للداشبورد بعد الحذف
  } catch (err) {
    console.error(err);
    res.status(500).send("حدث خطأ أثناء الحذف");
  }
});
