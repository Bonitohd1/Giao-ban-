const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const oldMenu = `'        \\'<li class="report-menu-item" data-type="ton_dong">📦 Kiểm soát tồn đọng</li>\\' +'`;
const newMenu = `'        \\'<li class="report-menu-item" data-type="ton_dong">📦 Kiểm soát tồn đọng</li>\\' +\\n' +
'        \\'<li class="report-menu-item" data-type="maint_forecast">🛠 Dự báo bảo trì</li>\\' +'`;

if (code.indexOf(oldMenu) !== -1) {
    code = code.replace(oldMenu, newMenu);
    fs.writeFileSync('AppScript_v2_10.gs', code);
    console.log("Added Maintenance Forecast to report menu.");
} else {
    console.log("Could not find oldMenu pattern.");
}
