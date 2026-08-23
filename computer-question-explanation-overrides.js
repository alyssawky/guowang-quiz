// 计算机题逐题解释补充。
// 仅补强解释，不改题面、选项或答案。
(() => {
  if (typeof questions === "undefined" || !Array.isArray(questions)) return;

  const q = questions.find(item => item.id === "c2-q34");
  if (q) {
    q.explanation = "<strong>答案：</strong>选C、D。<br><strong>为什么H可以表示十六进制：</strong>H来自英文 <strong>Hexadecimal</strong>（十六进制）的首字母，因此数字后写H可表示该数是十六进制，例如2AH。<br><strong>为什么16也可以：</strong>把16写在数字右下角/下标位置，是直接用基数标明进制，例如(2A)₁₆。<br><strong>逐项判断：</strong>B来自Binary，通常表示二进制；D来自Decimal，通常表示十进制；H=Hexadecimal，表示十六进制；下标16也表示十六进制。<br><strong>记忆：</strong>B=Binary（二进制），O=Octal（八进制），D=Decimal（十进制），H=Hexadecimal（十六进制）。";
  }
})();
