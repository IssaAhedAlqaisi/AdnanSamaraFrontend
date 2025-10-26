// js/print-helper.js
const COMPANY = {
  name: "شركة عدنان سماره لنقل المياه",
  tagline: "نقل المياه بالصهاريج",
  logo: "images/logo.png"
};

function openPrintWindow(html) {
  const w = window.open("", "_blank");
  w.document.write(`
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>طباعة عقد</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css">
        <link rel="stylesheet" href="css/print.css">
      </head>
      <body>${html}</body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 200);
}

function hdr(title){
  return `
    <div class="contract-header">
      <img src="${COMPANY.logo}" alt="logo">
      <div class="title">
        <h2>${COMPANY.name}</h2>
        <small>${COMPANY.tagline}</small><br>
        <small>${title}</small>
      </div>
    </div>
  `;
}
function todayAR(){
  return new Date().toLocaleDateString('ar-EG');
}

/* ————— قالب: عقد استلام عهدة سيارة ————— */
/* النص مأخوذ من الملف المرسل (مع الحفاظ على روحه والفراغات للكتابة اليدوية) */
function tplCarCustody(){
  return `
    <div class="contract-sheet">
      ${hdr("عقد استلام عهدة سيارة")}
      <div class="contract-meta">
        <span><b>التاريخ:</b> ${todayAR()}</span>
        <span><b>المكان:</b> الزرقاء</span>
      </div>
      <div class="contract-body">
أنا الموقع أدناه .......................... 
رقم وطني: .................................

حيث أعمل بوظيفة سائق لدى ${COMPANY.name}، أقرّ بأنني استلمت سيارة لشحن تنك ماء 
رقم اللوحة: .......................... 
العائدة لـ ${COMPANY.name} وتعتبر السيارة تحت أمانتي وعهدتي من تاريخ: ................. 
وأنا مسؤول عنها مسؤولية كاملة، حيث استلمتها ومحتوياتها ضمن المواصفات التالية:

1) .........................................
2) .........................................
3) .........................................
4) .........................................

      </div>

      <div class="contract-sign">
        <div class="sign-box">
          <b>اسم السائق</b>
          الاسم: _____________________________<br>
          رقم وطني: _________________________
        </div>
        <div class="sign-box">
          <b>الشهود</b>
          شاهد (1): _________________________<br>
          شاهد (2): _________________________
        </div>
      </div>
    </div>
  `;
}

/* ————— قالب: عقد توريد مياه ————— */
/* النص مأخوذ من الملف المرسل (مع تبويب البنود وترتيبها للطباعة) */
function tplWaterSupply(){
  return `
    <div class="contract-sheet">
      ${hdr("عقد توريد مياه")}
      <div class="contract-meta">
        <span><b>اليوم:</b> ${todayAR()}</span>
        <span><b>المدة:</b> ستة أشهر قابلة للتمديد</span>
      </div>

      <div class="contract-body">
الطرف الأول: مؤسسة عدنان سماره لنقل المياه عبر الصهاريج، ويمثلها السيد عدنان سمارة، يحمل الرقم الوطني 9991014261. 
الطرف الثاني: ...................................................
رقم وطني: .................................

حيث يرغب الطرف الأول بالتعاقد مع الطرف الثاني لتوريد مياه صالحة للشرب من خلال صهريج المياه العائد ملكيته للطرف الثاني، 
حيث يملك الطرف الثاني صهريج ماء سعة (....) لتر، تحمل لوحة رقم (....).
ويرغب الطرف الأول التعاقد معه لتوريد المياه لزبائن الطرف الأول عند الطلب.

<b>شروط العقد:</b>
1) يتعهد الطرف الثاني بتأمين مياه صالحة للشرب ضمن مواصفات وزارة المياه والمصادر الموثوقة للدولة الأردنية.
2) يتعهد الطرف الثاني بتأمين المياه وقت الطلب بموعد أقصاه ساعتان أو حسب الاتفاق (....).
3) يتعهد الطرف الثاني بألا يدلي بأي معلومات تخص أسرار عمل الطرف الأول للعميل، وألا يعطي العميل معلومات التواصل الخاصة به (كالهاتف).
4) يتعهد الطرف الأول بحساب نقل المياه حسب الاتفاق بين الطرفين.
   - اتفق الطرفان على سعر متر الماء (....).
   - شرط جزائي: ثلاثة آلاف دينار لأي طرف يخل ببنود العقد وشروطه.
   - يعتبر هذا العقد بمثابة إنذار عدلي لكلا الطرفين؛ لا يحتاج لأي إنذار أو إخطار. ويحق لأي طرف تقديمه للمحاكم المختصة مباشرة داخل نطاق مدينة إربد (قصر عدل إربد).
   - يعتبر الطرف الأول غير مسؤول عن أي ضرر أو مخالفات أو أعطال ميكانيكية وغيرها مما يتعلق بسيارة الطرف الثاني.

اتفق الطرفان على أن سعر متر الماء (....).
مدة العقد: ستة أشهر قابلة للتمديد بموافقة الطرفين.

      </div>

      <div class="contract-sign">
        <div class="sign-box">
          <b>الفريق الأول</b>
          ${COMPANY.name}<br>
          التوقيع: ________________
        </div>
        <div class="sign-box">
          <b>الفريق الثاني</b>
          الاسم: ___________________<br>
          التوقيع: ________________
        </div>
      </div>
    </div>
  `;
}

/* أزرار طباعة جاهزة للاستدعاء من الصفحة */
function printCarCustody(){ openPrintWindow(tplCarCustody()); }
function printWaterSupply(){ openPrintWindow(tplWaterSupply()); }

/* ترتيب (رفع/تنزيل) بطاقات العقود في الرئيسية */
function moveContract(cardId, dir){
  const card = document.getElementById(cardId);
  if (!card) return;
  const parent = card.parentElement;
  if (dir === 'up' && card.previousElementSibling) parent.insertBefore(card, card.previousElementSibling);
  if (dir === 'down' && card.nextElementSibling) parent.insertBefore(card.nextElementSibling, card);
}
