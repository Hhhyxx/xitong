/* =====================================================
   modals.js  — 全局弹窗（无依赖页面上下文）
===================================================== */
// 此文件为扩展预留，复杂弹窗逻辑在 components.js 中实现
// 如需添加全局弹窗（如确认框、图片预览等），在此处添加

/** 通用确认框 */
function confirmDialog(message, onConfirm) {
  showModal(`
  <div class="modal modal-sm">
    <div class="modal-header">
      <div class="modal-title">⚠️ 确认操作</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <p style="font-size:14px;color:var(--text-muted);margin-bottom:24px">${escHtml(message)}</p>
    <div class="modal-footer">
      <button class="btn btn-danger" onclick="closeModal();(${onConfirm})()">确认</button>
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
    </div>
  </div>`);
}
