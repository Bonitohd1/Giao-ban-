const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const old1 = '"ton_dong": "📦 KIỂM SOÁT TỒN ĐỌNG"';
const new1 = '"ton_dong": "📦 KIỂM SOÁT TỒN ĐỌNG",\n    "maint_forecast": "🛠 DỰ BÁO BẢO TRÌ & BẢO HÀNH"';

const old2 = '(mode === "forecast") ? "linear-gradient(135deg,#065F46,#10B981)" :';
const new2 = '(mode === "forecast") ? "linear-gradient(135deg,#065F46,#10B981)" :\n                   (mode === "maint_forecast") ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" :';

if (code.indexOf(old1) !== -1) {
    code = code.replace(old1, new1);
    code = code.replace(old2, new2);
    fs.writeFileSync('AppScript_v2_10.gs', code);
    console.log("Successfully updated _buildBriefHtml via node script.");
} else {
    console.log("Could not find old1 pattern.");
}
