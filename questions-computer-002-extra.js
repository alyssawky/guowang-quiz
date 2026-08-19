// 第二章《数据的表示与运算》补充题：数据校验编码
(() => {
  questions.push({
    id: "c2-q50",
    sourceId: "C2-Q50",
    taskId: "computer-002",
    type: "single",
    priority: "S",
    topic: "2-12 数据校验编码",
    question: "适合于对一批数据进行校验的是（　　）。",
    options: {
      A: "奇校验",
      B: "偶校验",
      C: "循环冗余校验码",
      D: "海明校验码"
    },
    answer: "C",
    explanation: "<strong>正确答案：C．循环冗余校验码（CRC）。</strong><br><br><strong>步骤1：先看题眼“对一批数据进行校验”。</strong><br>这里不是只检查某一个二进制位，而是要对一整批、一个数据块或一帧数据进行整体检错。<br><br><strong>步骤2：判断奇校验和偶校验。</strong><br>奇校验、偶校验都属于奇偶校验。它们通常只增加一个校验位，通过统计1的个数是奇数还是偶数来发现部分错误，方法简单，但检错能力有限，不适合强调“一批数据”的整体校验。<br><br><strong>步骤3：判断CRC。</strong><br>CRC把一批二进制数据看成一个整体，按照约定的生成多项式进行模2除法，把得到的余数作为校验码附加在数据后面。接收方用同样的方法重新计算，如果余数不符合约定，就说明数据在传输或存储过程中发生了错误。因此CRC特别适合对数据块、数据帧等一批数据进行校验。<br><br><strong>步骤4：判断海明码。</strong><br>海明码通过增加多个校验位来定位错误，典型用途是检测并纠正单比特错误。它更强调“定位/纠错”，不是本题“一批数据整体校验”的典型答案。<br><br><strong>结论：</strong>题目出现“一批数据进行校验”，优先想到<strong>循环冗余校验码 CRC</strong>，所以选C。<br><strong>易错点：</strong>看到“校验”不要把所有校验码都选上；要根据题干功能区分：奇偶校验＝简单检错，CRC＝数据块/批量数据检错，海明码＝定位并纠正错误。",
    lockOptionOrder: true,
    shuffleOptions: false,
    sourceSet: "用户补充题",
    chapter: "第二章 数据的表示与运算",
    note: "本题由用户补充，答案指定为循环冗余校验码（CRC）。",
    sourceAnswerProvided: true
  });
})();
