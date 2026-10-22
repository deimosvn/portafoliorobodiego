// Idiomas: español (texto original de la página), inglés, japonés y chino simplificado.
// Detecta el idioma del dispositivo, recuerda la elección y avisa a los demás scripts con el evento "langchange".
(function i18n() {
  const LANGS = ['es', 'en', 'ja', 'zh'];
  const LOCALE = { es: 'es-MX', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' };
  const FONTS = {
    ja: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap',
    zh: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap',
  };

  // Textos de la página: clave → [inglés, japonés, chino]. El español sale del HTML.
  const K = {
    'ui.skip': ['Skip to content', 'コンテンツへスキップ', '跳到正文'],
    'page.inicio': ['Home', 'ホーム', '首页'],
    'page.perfil': ['Profile', 'プロフィール', '简介'],
    'page.startups': ['Startups', 'スタートアップ', '创业项目'],
    'page.ingenieria': ['Engineering', 'エンジニアリング', '工程'],
    'page.diseno': ['CAD designs', 'CAD設計', 'CAD 设计'],
    'page.experiencia': ['Experience', '経歴', '经历'],
    'page.logros': ['Awards', '実績', '成就'],
    'page.prensa': ['Press', 'メディア', '媒体报道'],
    'page.formacion': ['Certifications', '資格・認定', '认证'],
    'page.contacto': ['Contact', 'お問い合わせ', '联系'],
    'nav.cad': ['CAD', 'CAD', 'CAD'],
    'ui.sheet': ['Sheet', 'シート', '图纸'],
    'ui.lang': ['Language', '言語', '语言'],
    'ui.theme': ['Toggle light and dark theme', 'ライト/ダークテーマを切り替え', '切换浅色/深色主题'],
    'ui.index': ['Open section index', 'セクション一覧を開く', '打开章节目录'],
    'ui.indexName': ['Section index', 'セクション一覧', '章节目录'],
    'ui.indexTitle': ['Sheet index', 'シート一覧', '图纸目录'],
    'ui.close': ['Close', '閉じる', '关闭'],
    'ui.code': ['Code ↗', 'コード ↗', '代码 ↗'],
    'ui.lam': ['Sheet', '図面', '图'],
    'ui.explode': ['Explode', '分解', '爆炸'],
    'ui.opencad': ['Open CAD viewer', 'CADビューアを開く', '打开 CAD 查看器'],
    'ui.open': ['Open', '開く', '打开'],
    'ui.footer': ['Real-time drawings and CAD viewer built with', 'リアルタイム図面とCADビューアの制作：', '实时图纸与 CAD 查看器基于'],

    'hero.namealt': ['', 'ディエゴ・エドゥアルド・マルティネス・クルス', '迭戈·爱德华多·马丁内斯·克鲁斯'],
    'hero.role': ['Mechatronics engineer · Founder & CEO of Qubiko', 'メカトロニクスエンジニア · Qubiko 創業者兼CEO', '机电一体化工程师 · Qubiko 创始人兼 CEO'],
    'hero.lede': ['Industrial robotics, AI and startups that make technology accessible, from Mexicali, Baja California.', '産業用ロボット、AI、そしてテクノロジーを身近にするスタートアップ。メキシコ・バハカリフォルニア州メヒカリから。', '工业机器人、人工智能与让技术更普及的创业项目，来自墨西哥下加利福尼亚州墨西卡利。'],
    'hero.cta1': ['View projects', 'プロジェクトを見る', '查看项目'],
    'hero.canvas': ['Animated manufacturing line with five robot types: six-axis arm, delta robot, SCARA robot, mobile robot and drone', '5種類のロボットが動く製造ライン：6軸アーム、デルタロボット、SCARAロボット、移動ロボット、ドローン', '五种机器人运行的生产线动画：六轴机械臂、Delta 机器人、SCARA 机器人、移动机器人和无人机'],
    'hero.fig': ['Fig. 01 · Manufacturing line · 5 robot types', '図01 · 製造ライン · 5種類のロボット', '图 01 · 生产线 · 5 种机器人'],
    'hero.pieces': ['Parts', '個数', '件数'],
    'hero.legend': ['<b>1</b> 6-axis · <b>2</b> Delta · <b>3</b> SCARA · <b>4</b> AMR · <b>5</b> Drone', '<b>1</b> 6軸 · <b>2</b> デルタ · <b>3</b> SCARA · <b>4</b> AMR · <b>5</b> ドローン', '<b>1</b> 六轴 · <b>2</b> Delta · <b>3</b> SCARA · <b>4</b> AMR · <b>5</b> 无人机'],
    'm.1': ['students trained in robotics', '人の生徒がロボットを学習', '名学生接受机器人培训'],
    'm.2n': ['1<sup>st</sup>', '1<sup>位</sup>', '第1<sup>名</sup>'],
    'm.2': ['place nationally in Bécalos × POSiBLE 2026', 'Bécalos × POSiBLE 2026 全国大会', 'Bécalos × POSiBLE 2026 全国赛'],
    'm.3': ['hackathons, including NASA Space Apps and Talent Land', '回のハッカソン（NASA Space Apps、Talent Land など）', '场黑客马拉松，包括 NASA Space Apps 和 Talent Land'],
    'm.4': ['startups shaping the future of work and education in Latin America', 'ラテンアメリカの仕事と教育の未来を担うスタートアップ', '拉丁美洲工作与教育未来领域创业公司'],

    'perfil.crumbs': ['Sheet 02 <span>&gt;</span> <b>Profile</b>', 'シート02 <span>&gt;</span> <b>プロフィール</b>', '图纸 02 <span>&gt;</span> <b>简介</b>'],
    'perfil.h': ['Engineering, education and innovation', 'エンジニアリング、教育、イノベーション', '工程、教育与创新'],
    'perfil.p': ['Tech entrepreneur specialized in robotics, artificial intelligence and physical AI.', 'ロボット工学、人工知能、フィジカルAIを専門とするテック起業家。', '专注于机器人、人工智能和物理 AI 的科技创业者。'],
    'perfil.lead': ['I’m a mechatronics engineer and the founder of Qubiko, an AI platform that turns an idea into a complete robotics project.', 'メカトロニクスエンジニアであり、アイデアを完全なロボットプロジェクトに変えるAIプラットフォーム Qubiko の創業者です。', '我是一名机电一体化工程师，也是 Qubiko 的创始人。Qubiko 是一个能把想法变成完整机器人项目的 AI 平台。'],
    'perfil.bio': ['Before starting a company I programmed FANUC and KUKA robots, PLCs and drives on the plant floor for clients such as Kellogg’s, Bimbo and Intuitive Surgical. Since 2023 I have trained more than 2,000 students, starting with free workshops in communities with little access to technology.', '起業する前は、Kellogg’s、Bimbo、Intuitive Surgical などの顧客のために、工場で FANUC や KUKA のロボット、PLC、インバータをプログラムしていました。2023年からは、テクノロジーに触れる機会の少ない地域での無料ワークショップを皮切りに、2,000人以上の生徒を指導しています。', '创业之前，我在工厂现场为 Kellogg’s、Bimbo 和 Intuitive Surgical 等客户编程 FANUC 与 KUKA 机器人、PLC 和变频器。自 2023 年起，我从在技术资源匮乏的社区开办免费工作坊开始，已培训了 2,000 多名学生。'],
    'perfil.where': ['Where I’ve worked', '活動分野', '工作领域'],
    'a1.h': ['Industrial automation', '産業オートメーション', '工业自动化'],
    'a1.p': ['Commissioning and diagnostics on food production lines.', '食品生産ラインの立ち上げと診断。', '食品生产线的调试与诊断。'],
    'a2.h': ['Medical devices', '医療機器', '医疗器械'],
    'a2.p': ['Commissioning and diagnostics of equipment in the medical industry.', '医療業界の設備の立ち上げと診断。', '医疗行业设备的调试与诊断。'],
    'a3.h': ['Industrial robotics', '産業用ロボット', '工业机器人'],
    'a3.p': ['FANUC and KUKA robots, ROS 2 and manufacturing cells.', 'FANUC・KUKA ロボット、ROS 2、製造セル。', 'FANUC 与 KUKA 机器人、ROS 2 和制造单元。'],
    'a4.h': ['STEM education', 'STEM教育', 'STEM 教育'],
    'a4.p': ['Free workshops and an AI platform for kids and teens.', '子どもと若者のための無料ワークショップとAIプラットフォーム。', '面向青少年的免费工作坊和 AI 平台。'],
    'a5.h': ['Water and sustainability', '水とサステナビリティ', '水资源与可持续发展'],
    'a5.p': ['Hydrogel desalination, with a patent pending.', 'ハイドロゲルによる淡水化（特許出願中）。', '水凝胶海水淡化技术，专利申请中。'],
    'a6.p': ['Robots that learn in physics simulation before the real world.', '現実世界の前に物理シミュレーションで学ぶロボット。', '先在物理仿真中学习、再进入现实世界的机器人。'],
    'a7.h': ['Quantum computing', '量子コンピューティング', '量子计算'],
    'a7.p': ['QAOA and VQE for control, routing and materials.', '制御・経路計画・材料のための QAOA と VQE。', '用于控制、路径和材料的 QAOA 与 VQE。'],
    'a8.h': ['Competition robotics', '競技ロボット', '竞赛机器人'],
    'a8.p': ['CRAI, Baja Robotics League, URC and 10 hackathons.', 'CRAI、Baja Robotics League、URC、10回のハッカソン。', 'CRAI、Baja Robotics League、URC 和 10 场黑客马拉松。'],

    'st.crumbs': ['Sheet 03 <span>&gt;</span> <b>Startups and community</b>', 'シート03 <span>&gt;</span> <b>スタートアップとコミュニティ</b>', '图纸 03 <span>&gt;</span> <b>创业与社区</b>'],
    'st.h': ['Startups in operation', '運営中のスタートアップ', '正在运营的创业项目'],
    'st.p': ['An EdTech startup with its own hardware and a community for founders and makers in Mexicali.', '自社ハードウェアを持つEdTechスタートアップと、メヒカリの起業家・メイカーのためのコミュニティ。', '一家拥有自研硬件的教育科技创业公司，以及一个面向墨西卡利创始人和创客的社区。'],
    'q.alt': ['Qubiko home page: create anything STEM, wherever you are', 'Qubiko のトップページ', 'Qubiko 首页'],
    'q.crumbs': ['EdTech <span>&gt;</span> <b>AI + hardware</b>', 'EdTech <span>&gt;</span> <b>AI + ハードウェア</b>', '教育科技 <span>&gt;</span> <b>AI + 硬件</b>'],
    'q.role': ['<b>Founder & CEO</b> · 2026 – present', '<b>創業者兼CEO</b> · 2026年 – 現在', '<b>创始人兼 CEO</b> · 2026 年至今'],
    'q.desc': ['AI platform to build any STEM project, with its own hardware: the Qubiko Core controller and the DowelBot kit. Co-founded with Daniel Jared Curiel Avalos and América Michelle Rodríguez Solís.', 'あらゆるSTEMプロジェクトを作れるAIプラットフォーム。独自ハードウェアとして Qubiko Core コントローラと DowelBot キットを開発。共同創業者は Daniel Jared Curiel Avalos と América Michelle Rodríguez Solís。', '一个可创建任何 STEM 项目的 AI 平台，配有自研硬件：Qubiko Core 控制器和 DowelBot 套件。联合创始人为 Daniel Jared Curiel Avalos 和 América Michelle Rodríguez Solís。'],
    'q.r1': ['Idea as text, voice or photo', 'テキスト・音声・写真でアイデアを入力', '用文字、语音或照片描述想法'],
    'q.r2': ['3D design, code and wiring diagram', '3D設計、コード、配線図', '3D 设计、代码和电路图'],
    'q.r3': ['Step-by-step build path', '組み立ての手順', '分步搭建路线'],
    'q.st': ['1<sup>st</sup> place nationally, Bécalos × POSiBLE 2026', 'Bécalos × POSiBLE 2026 全国1位', 'Bécalos × POSiBLE 2026 全国第一名'],
    'c.alt': ['CRAI Club home page: for those who design what’s next', 'CRAI Club のトップページ', 'CRAI Club 首页'],
    'c.crumbs': ['Community <span>&gt;</span> <b>Mexicali · 686</b>', 'コミュニティ <span>&gt;</span> <b>Mexicali · 686</b>', '社区 <span>&gt;</span> <b>Mexicali · 686</b>'],
    'c.role': ['<b>Founder & captain</b> · Firebase · Vercel', '<b>創設者兼キャプテン</b> · Firebase · Vercel', '<b>创始人兼队长</b> · Firebase · Vercel'],
    'c.desc': ['Started as an advanced robotics club for competitions. Today it is also the club for founders, makers and creators in Mexicali, with profiles, Collab Match and an Apple Wallet membership card.', '競技向けの先進ロボットクラブとして始まり、現在はメヒカリの起業家・メイカー・クリエイターのクラブでもあります。プロフィール、Collab Match、Apple Wallet の会員証を備えています。', '最初是一个面向竞赛的高级机器人俱乐部，如今也是墨西卡利创始人、创客和创作者的俱乐部，提供个人主页、Collab Match 和 Apple Wallet 会员卡。'],
    'c.r1': ['People and Collab Match', 'People と Collab Match', 'People 与 Collab Match'],
    'c.r2': ['Projects, Events and Quests', 'Projects、Events、Quests', 'Projects、Events 与 Quests'],
    'c.r3': ['Build Night: Thursdays, 7–10 pm', 'Build Night：毎週木曜 19:00〜22:00', 'Build Night：每周四 19:00–22:00'],
    'c.st': ['For those who build what’s next', '次をつくる人たちのために', '为构建未来的人而生'],

    'ing.crumbs': ['Sheet 04 <span>&gt;</span> <b>AI Physics, ROS 2 and quantum computing</b>', 'シート04 <span>&gt;</span> <b>AI Physics、ROS 2、量子コンピューティング</b>', '图纸 04 <span>&gt;</span> <b>AI Physics、ROS 2 与量子计算</b>'],
    'ing.h': ['Engineering sheets', 'エンジニアリング図面', '工程图纸'],
    'ing.p': ['Six GitHub projects. The first sheet runs live.', 'GitHub の6つのプロジェクト。最初のシートはライブで動きます。', '六个 GitHub 项目。第一张图纸实时运行。'],
    'l1.cat': ['AI Physics · Learning in simulation', 'AI Physics · シミュレーションで学習', 'AI Physics · 在仿真中学习'],
    'l1.h': ['A self-balancing robot that learns', '自ら学ぶ倒立振子ロボット', '会学习的自平衡机器人'],
    'l1.p': ['Physics of an inverted pendulum on wheels, simulated live. Each generation tests 32 controllers and keeps the best; within seconds it learns to stay upright.', '車輪付き倒立振子の物理をリアルタイムでシミュレーション。各世代で32個の制御器を試して優秀なものを残し、数秒で立ち続けることを学習します。', '实时仿真轮式倒立摆的物理过程。每一代测试 32 个控制器并保留最优者，几秒钟内就能学会保持直立。'],
    'l1.push': ['Push the robot', 'ロボットを押す', '推一下机器人'],
    'l1.reset': ['Restart', 'リセット', '重新开始'],
    'l1.fig': ['Fig. 01 · Live simulation', '図01 · ライブシミュレーション', '图 01 · 实时仿真'],
    'l1.canvas': ['Simulation of a two-wheeled robot learning to balance', 'バランスを学ぶ二輪ロボットのシミュレーション', '学习保持平衡的两轮机器人仿真'],
    'tag.sim': ['Physics simulation', '物理シミュレーション', '物理仿真'],
    'tag.rl': ['Reinforcement learning', '強化学習', '强化学习'],
    'sim.gen': ['Generation', '世代', '代数'],
    'sim.rew': ['Reward', '報酬', '奖励'],
    'sim.sig': ['Exploration σ', '探索 σ', '探索 σ'],
    'sim.k': ['Gains K = [x, ẋ, θ, θ̇]', 'ゲイン K = [x, ẋ, θ, θ̇]', '增益 K = [x, ẋ, θ, θ̇]'],
    'l2.cat': ['ROS 2 · Hybrid control', 'ROS 2 · ハイブリッド制御', 'ROS 2 · 混合控制'],
    'l2.p': ['ROS 2 stack for an autonomous rover: it closes the velocity loop with QAOA and falls back to a PID when the quantum backend is unavailable.', '自律ローバー向けの ROS 2 スタック。QAOA で速度ループを閉じ、量子バックエンドが使えないときは PID に切り替えます。', '面向自主漫游车的 ROS 2 软件栈：用 QAOA 闭合速度环，量子后端不可用时切换为 PID。'],
    'l2.fig': ['Fig. 02 · Block diagram', '図02 · ブロック線図', '图 02 · 方框图'],
    'l2.fig2': ['Closed loop', '閉ループ', '闭环'],
    'l2.f1': ['Velocity profile', '速度プロファイル', '速度曲线'],
    'l2.f2': ['QAOA ⇄ PID controller', 'QAOA ⇄ PID 制御器', 'QAOA ⇄ PID 控制器'],
    'l2.f3': ['DC motor', 'DCモータ', '直流电机'],
    'l2.f4': ['Odometry and TF', 'オドメトリと TF', '里程计与 TF'],
    'l2.cap': ['Step response: reference, PID and QAOA', 'ステップ応答：目標値、PID、QAOA', '阶跃响应：参考值、PID 与 QAOA'],
    'l3.cat': ['micro-ROS · Embedded', 'micro-ROS · 組込み', 'micro-ROS · 嵌入式'],
    'l3.p': ['C++ firmware for the ESP32 that plans a rover’s routes with a quantum-inspired evolutionary algorithm, on FreeRTOS and micro-ROS, with no cloud dependency.', '量子インスパイアド進化アルゴリズムでローバーの経路を計画する ESP32 向け C++ ファームウェア。FreeRTOS と micro-ROS 上で動き、クラウドに依存しません。', '运行在 ESP32 上的 C++ 固件，用量子启发进化算法为漫游车规划路线，基于 FreeRTOS 和 micro-ROS，不依赖云端。'],
    'l3.chip': ['45 KB of RAM', 'RAM 45 KB', '45 KB 内存'],
    'l3.fig': ['Fig. 03 · Edge architecture', '図03 · エッジ構成', '图 03 · 边缘架构'],
    'l3.f1': ['Sensors and map', 'センサと地図', '传感器与地图'],
    'l3.f2': ['QUBO model', 'QUBO モデル', 'QUBO 模型'],
    'l3.f3': ['QIEA on ESP32', 'ESP32 上の QIEA', 'ESP32 上的 QIEA'],
    'l3.f4': ['Route via micro-ROS', 'micro-ROS で経路配信', '通过 micro-ROS 发布路线'],
    'l3.cap': ['Route planned on the microcontroller, avoiding obstacles', 'マイコン上で計画した障害物回避ルート', '在微控制器上规划的避障路线'],
    'l4.cat': ['Quantum · Swarms', '量子 · 群ロボット', '量子 · 集群'],
    'l4.p': ['Route planning for robot swarms that combines QAOA with A* to avoid obstacles and collisions with less energy.', 'QAOA と A* を組み合わせ、少ないエネルギーで障害物や衝突を避ける群ロボットの経路計画。', '结合 QAOA 与 A* 的机器人集群路径规划，以更少能耗避开障碍和碰撞。'],
    'l4.chip': ['50 to 200 robots', '50〜200台のロボット', '50 至 200 台机器人'],
    'l4.fig': ['Fig. 04 · Hybrid flow', '図04 · ハイブリッドフロー', '图 04 · 混合流程'],
    'l4.f1': ['Map and goals', '地図と目標', '地图与目标'],
    'l4.f2': ['QAOA · 8 qubits per robot', 'QAOA · 1台あたり8量子ビット', 'QAOA · 每台机器人 8 个量子比特'],
    'l4.f3': ['A* fallback', 'A* によるバックアップ', 'A* 备用方案'],
    'l4.f4': ['Collision-free routes', '衝突のない経路', '无碰撞路线'],
    'l4.cap': ['Four swarm robots share the space without colliding', '4台の群ロボットが衝突せずに空間を共有', '四台集群机器人共享空间且互不碰撞'],
    'l5.cat': ['Quantum · Water', '量子 · 水', '量子 · 水资源'],
    'l5.h': ['QWOS and QuantumHydroCore', 'QWOS と QuantumHydroCore', 'QWOS 与 QuantumHydroCore'],
    'l5.p': ['QWOS optimizes in real time the operation of HER-DS1, the patent-pending hydrogel desalination system. QuantumHydroCore uses VQE to design molecular filters.', 'QWOS は特許出願中のハイドロゲル淡水化システム HER-DS1 の運転をリアルタイムで最適化します。QuantumHydroCore は VQE で分子フィルタを設計します。', 'QWOS 实时优化专利申请中的水凝胶海水淡化系统 HER-DS1 的运行；QuantumHydroCore 使用 VQE 设计分子过滤器。'],
    'l5.chip': ['Target: −45% energy per m³', '目標：m³あたりのエネルギー −45%', '目标：每立方米能耗 −45%'],
    'tag.mpc': ['Predictive control', '予測制御', '预测控制'],
    'l5.fig': ['Fig. 05 · Quantum-classical pipeline', '図05 · 量子・古典パイプライン', '图 05 · 量子-经典流水线'],
    'l5.f1': ['VQE calibration', 'VQE キャリブレーション', 'VQE 标定'],
    'l5.f2': ['QAOA optimization', 'QAOA 最適化', 'QAOA 优化'],
    'l5.f3': ['QMPC control', 'QMPC 制御', 'QMPC 控制'],
    'l5.f4': ['HER-DS1 plant', 'HER-DS1 プラント', 'HER-DS1 装置'],
    'l5.cap': ['One QAOA layer: H, ZZ couplings, RX and measurement', 'QAOA 回路の1層：H、ZZ結合、RX、測定', '一层 QAOA 电路：H、ZZ 耦合、RX 与测量'],
    'l6.cat': ['AI + quantum · Agriculture', 'AI + 量子 · 農業', 'AI + 量子 · 农业'],
    'l6.p': ['Detects crop diseases before visible symptoms using multispectral vision, AI and QAOA and VQE optimization. Built for InnovaTecNM 2026.', 'マルチスペクトル画像、AI、QAOA・VQE 最適化で、症状が見える前に作物の病気を検出します。InnovaTecNM 2026 のために開発。', '利用多光谱视觉、AI 以及 QAOA 和 VQE 优化，在症状显现之前发现作物病害。为 InnovaTecNM 2026 开发。'],
    'l6.fig': ['Fig. 06 · Early detection', '図06 · 早期検出', '图 06 · 早期检测'],
    'l6.fig2': ['Field', '圃場', '田间'],
    'l6.f1': ['Multispectral camera', 'マルチスペクトルカメラ', '多光谱相机'],
    'l6.f2': ['AI model', 'AI モデル', 'AI 模型'],
    'l6.f3': ['QAOA / VQE optimization', 'QAOA / VQE 最適化', 'QAOA / VQE 优化'],
    'l6.f4': ['Early alert', '早期アラート', '早期预警'],
    'l6.cap': ['Multispectral crop map: flagged zones show stress before it is visible', '作物のマルチスペクトル地図：印の付いた区域は目に見える前にストレスを示します', '作物多光谱地图：标记区域在肉眼可见之前就显示出胁迫'],
    'ing.more': ['More projects', 'その他のプロジェクト', '更多项目'],
    'mi1.k': ['Control', '制御', '控制'],
    'mi1.h': ['PID process control', 'PID プロセス制御', 'PID 过程控制'],
    'mi1.p': ['PID control system for a process, programmed on a PLC. Academic project with UPBC.', 'PLC でプログラムしたプロセス向け PID 制御システム。UPBC での学術プロジェクト。', '在 PLC 上编程的过程 PID 控制系统，与 UPBC 合作的学术项目。'],
    'mi1.tb': ['Academic', '学術', '学术'],
    'mi2.k': ['Automation · AI', '自動化 · AI', '自动化 · AI'],
    'mi2.p': ['AI-generated PLC code for 16 brands and 6 IEC 61131-3 languages, with auditing and I/O extraction from diagrams.', '16メーカー・IEC 61131-3 の6言語に対応した AI による PLC コード生成。監査と図面からの I/O 抽出も可能。', '用 AI 为 16 个品牌、6 种 IEC 61131-3 语言生成 PLC 代码，支持代码审查和从图纸提取 I/O。'],
    'mi3.k': ['Language · Rovers', '言語 · ローバー', '语言 · 漫游车'],
    'mi3.p': ['A language for programming rovers that catches physical-unit errors at compile time and generates C.', '物理単位の誤りをコンパイル時に検出し、C を生成するローバー用プログラミング言語。', '一种漫游车编程语言，能在编译时发现物理单位错误并生成 C 代码。'],
    'mi4.alt': ['BRL Control Pro screen with joysticks and kick, pass and stop buttons', 'ジョイスティックとキック・パス・停止ボタンのある BRL Control Pro の画面', '带摇杆和踢球、传球、停止按钮的 BRL Control Pro 界面'],
    'mi4.k': ['Competition', '競技', '竞赛'],
    'mi4.p': ['App to control soccer robots over Bluetooth, WiFi or RF, with firmware for ESP32 and Arduino.', 'Bluetooth・WiFi・RF でサッカーロボットを操作するアプリ。ESP32 と Arduino 用ファームウェア付き。', '通过蓝牙、WiFi 或 RF 控制足球机器人的应用，附带 ESP32 和 Arduino 固件。'],
    'mi5.p': ['Free robotics workshops with electronic modules, an AI tutor and a teacher dashboard. The precursor to Qubiko.', '電子モジュール、AIチューター、教師用ダッシュボードを備えた無料ロボット教室。Qubiko の前身。', '配备电子模块、AI 导师和教师面板的免费机器人工作坊，是 Qubiko 的前身。'],
    'mi6.k': ['Computer vision', 'コンピュータビジョン', '计算机视觉'],
    'mi6.p': ['A DJ mixer controlled by the position of your hands in front of the camera.', 'カメラの前の手の位置で操作するDJミキサー。', '通过摄像头前的手部位置来控制的 DJ 混音器。'],

    'cad.crumbs': ['Sheet 05 <span>&gt;</span> <b>Mechanical CAD design</b>', 'シート05 <span>&gt;</span> <b>機械CAD設計</b>', '图纸 05 <span>&gt;</span> <b>机械 CAD 设计</b>'],
    'cad.p': ['As you scroll, each assembly separates into its parts. Open it in the viewer to rotate it, measure it and see its bill of materials.', 'スクロールすると各アセンブリが部品に分解されます。ビューアで開くと回転・計測・部品表の確認ができます。', '滚动时，每个装配体会分解为零件。在查看器中打开即可旋转、测量并查看物料清单。'],
    'd1.crumbs': ['Flexible manufacturing <span>&gt;</span> <b>ITM project</b>', 'フレキシブル生産 <span>&gt;</span> <b>ITM プロジェクト</b>', '柔性制造 <span>&gt;</span> <b>ITM 项目</b>'],
    'd1.h': ['Robotic manufacturing cell', 'ロボット製造セル', '机器人制造单元'],
    'd1.p': ['Designed in SolidWorks and AutoCAD: a flexible cell with an industrial robot, CNC machining center, conveyor, fixture table and safety guarding.', 'SolidWorks と AutoCAD で設計したフレキシブルセル：産業用ロボット、CNCマシニングセンタ、コンベヤ、治具テーブル、安全ガード。', '用 SolidWorks 和 AutoCAD 设计的柔性单元：工业机器人、CNC 加工中心、输送带、夹具台和安全防护。'],
    'd1.fig': ['Fig. D-01 · Isometric representation', '図D-01 · 等角表示', '图 D-01 · 等轴测表示'],
    'd1.r1': ['6-axis robot on a pedestal', '台座上の6軸ロボット', '底座上的六轴机器人'],
    'd1.r2': ['CNC, conveyor and fixture table', 'CNC、コンベヤ、治具テーブル', 'CNC、输送带和夹具台'],
    'd1.r3': ['Perimeter guarding and light curtains', '周囲ガードとライトカーテン', '周边防护与安全光幕'],
    'd2.crumbs': ['Industrial robotics <span>&gt;</span> <b>Design study</b>', '産業用ロボット <span>&gt;</span> <b>設計スタディ</b>', '工业机器人 <span>&gt;</span> <b>设计研究</b>'],
    'd2.h': ['6-axis robotic arm', '6軸ロボットアーム', '六轴机械臂'],
    'd2.p': ['An articulated arm like the FANUC and KUKA robots I program: servomotors with reducers, a J3 counterweight, spherical wrist and gripper. It is the model that moves the robot on the home page.', '私がプログラムする FANUC や KUKA のような多関節アーム：減速機付きサーボモータ、J3 のカウンターウェイト、球面手首、グリッパ。トップページのロボットを動かしているモデルです。', '类似我编程的 FANUC 和 KUKA 机器人的关节臂：带减速器的伺服电机、J3 配重、球形手腕和夹爪。首页的机器人正是由这个模型驱动。'],
    'd2.fig': ['Fig. D-02 · Isometric view', '図D-02 · 等角図', '图 D-02 · 等轴测视图'],
    'd2.r1': ['Base and J1 turret', 'ベースと J1 旋回部', '底座与 J1 转台'],
    'd2.r2': ['Arm, elbow and forearm', 'アーム、エルボー、前腕', '大臂、肘部与小臂'],
    'd2.r3': ['Wrist, flange and gripper', '手首、フランジ、グリッパ', '手腕、法兰与夹爪'],
    'd3.crumbs': ['Vehicles <span>&gt;</span> <b>Design study</b>', '車両 <span>&gt;</span> <b>設計スタディ</b>', '车辆 <span>&gt;</span> <b>设计研究</b>'],
    'd3.h': ['6×6 exploration rover', '6×6 探査ローバー', '6×6 探测漫游车'],
    'd3.p': ['Rover with rocker-bogie suspension for rough terrain, designed for the University Rover Challenge and to run KinetiQ and Axon-R navigation.', '不整地向けロッカー・ボギー式サスペンションのローバー。University Rover Challenge 向けで、KinetiQ と Axon-R のナビゲーションを動かします。', '采用摇臂-转向架悬挂的崎岖地形漫游车，面向 University Rover Challenge，可运行 KinetiQ 和 Axon-R 导航。'],
    'd3.fig': ['Fig. D-03 · Isometric view', '図D-03 · 等角図', '图 D-03 · 等轴测视图'],
    'd3.r1': ['Rocker-bogie suspension', 'ロッカー・ボギー式サスペンション', '摇臂-转向架悬挂'],
    'd3.r2': ['Chassis with electronics bay', '電装ベイ付きシャーシ', '带电子舱的底盘'],
    'd3.r3': ['Camera mast and front arm', 'カメラマストと前部アーム', '相机桅杆与前臂'],
    'd4.crumbs': ['Aerospace <span>&gt;</span> <b>Design study</b>', '航空宇宙 <span>&gt;</span> <b>設計スタディ</b>', '航空航天 <span>&gt;</span> <b>设计研究</b>'],
    'd4.h': ['Experimental sounding rocket', '実験用観測ロケット', '实验探空火箭'],
    'd4.p': ['Two-section sounding rocket with its launch tower: nose cone, avionics bay, interstage coupler, fins and nozzle.', '発射塔付きの2段構成観測ロケット：ノーズコーン、アビオニクスベイ、段間カプラ、フィン、ノズル。', '带发射塔的两段式探空火箭：整流罩、航电舱、级间连接器、尾翼和喷管。'],
    'd4.fig': ['Fig. D-04 · Isometric view', '図D-04 · 等角図', '图 D-04 · 等轴测视图'],
    'd4.r1': ['Nose cone and avionics bay', 'ノーズコーンとアビオニクスベイ', '整流罩与航电舱'],
    'd4.r2': ['Stages, coupler and fins', '各段、カプラ、フィン', '箭体、连接器与尾翼'],
    'd4.r3': ['Nozzle and launch tower', 'ノズルと発射塔', '喷管与发射塔'],
    'd5.crumbs': ['Competition robotics <span>&gt;</span> <b>Baja Robotics League</b>', '競技ロボット <span>&gt;</span> <b>Baja Robotics League</b>', '竞赛机器人 <span>&gt;</span> <b>Baja Robotics League</b>'],
    'd5.h': ['BRL soccer robot', 'BRL サッカーロボット', 'BRL 足球机器人'],
    'd5.p': ['Two-level chassis with differential drive, solenoid kicker and ESP32 electronics, controlled with the BRL Control Pro app.', '差動駆動、ソレノイドキッカー、ESP32 電装を備えた2段シャーシ。BRL Control Pro アプリで操作します。', '双层底盘，采用差速驱动、电磁踢球器和 ESP32 电子系统，由 BRL Control Pro 应用控制。'],
    'd5.fig': ['Fig. D-05 · Isometric view', '図D-05 · 等角図', '图 D-05 · 等轴测视图'],
    'd5.r1': ['Differential drive', '差動駆動', '差速驱动'],
    'd5.r2': ['Solenoid kicker', 'ソレノイドキッカー', '电磁踢球器'],
    'd5.r3': ['ESP32 electronics', 'ESP32 電装', 'ESP32 电子系统'],
    'd6.crumbs': ['Water <span>&gt;</span> <b>Patent pending</b>', '水 <span>&gt;</span> <b>特許出願中</b>', '水资源 <span>&gt;</span> <b>专利申请中</b>'],
    'd6.h': ['HER-DS1 cell module', 'HER-DS1 セルモジュール', 'HER-DS1 单元模块'],
    'd6.p': ['Conceptual model of the electro-responsive hydrogel desalination module from the AGUA VIVA project. The geometry is illustrative; the detailed design is in the patent application.', 'AGUA VIVA プロジェクトの電気応答性ハイドロゲル淡水化モジュールの概念モデル。形状は説明用で、詳細設計は特許出願に記載されています。', 'AGUA VIVA 项目电响应水凝胶海水淡化模块的概念模型。几何形状仅为示意，详细设计见专利申请。'],
    'd6.fig': ['Fig. D-06 · Conceptual model', '図D-06 · 概念モデル', '图 D-06 · 概念模型'],
    'd6.r1': ['End plates and tie rods', 'エンドプレートとタイロッド', '端板与拉杆'],
    'd6.r2': ['Electrodes and gaskets', '電極とガスケット', '电极与密封垫'],
    'd6.r3': ['Hydrogel chambers', 'ハイドロゲル室', '水凝胶腔室'],

    'xp.crumbs': ['Sheet 06 <span>&gt;</span> <b>Experience and skills</b>', 'シート06 <span>&gt;</span> <b>経歴とスキル</b>', '图纸 06 <span>&gt;</span> <b>经历与技能</b>'],
    'xp.h': ['From the plant floor to the classroom and the startup', '工場から教室、そしてスタートアップへ', '从工厂到课堂，再到创业'],
    'xp.p': ['Industrial automation in the field, STEM education in the community and leading a startup.', '現場での産業オートメーション、地域でのSTEM教育、そしてスタートアップの経営。', '现场工业自动化、社区 STEM 教育以及创业公司管理。'],
    'x1.when': ['2026 – present', '2026年 – 現在', '2026 年至今'],
    'x1.h': ['Founder & CEO', '創業者兼CEO', '创始人兼 CEO'],
    'x1.a': ['Product and strategy for an AI platform that generates robotics projects.', 'ロボットプロジェクトを生成するAIプラットフォームの製品と戦略。', '负责生成机器人项目的 AI 平台的产品与战略。'],
    'x1.b': ['In-house hardware: DowelBot kit and Qubiko Core controller.', '自社ハードウェア：DowelBot キットと Qubiko Core コントローラ。', '自研硬件：DowelBot 套件和 Qubiko Core 控制器。'],
    'x1.c': ['Partnerships with Baja California public libraries, schools and Geeks Academy.', 'バハカリフォルニア州の公共図書館、学校、Geeks Academy との連携。', '与下加州公共图书馆、学校和 Geeks Academy 建立合作。'],
    'x2.when': ['2023 – present', '2023年 – 現在', '2023 年至今'],
    'x2.h': ['STEM and Robotics Teacher', 'STEM・ロボット講師', 'STEM 与机器人教师'],
    'x2.org': ['Community programs · CultivaTec', '地域プログラム · CultivaTec', '社区项目 · CultivaTec'],
    'x2.a': ['Project-based workshops in robotics, programming and electronics.', 'ロボット、プログラミング、電子工作のプロジェクト型ワークショップ。', '基于项目的机器人、编程和电子工作坊。'],
    'x2.b': ['More than 2,000 students, starting free of charge in vulnerable communities.', '2,000人以上の生徒。最初は支援が必要な地域で無料で開始。', '已超过 2,000 名学生，最初在弱势社区免费开展。'],
    'x3.h': ['Automation and field service', 'オートメーションとフィールドサービス', '自动化与现场服务'],
    'x3.a': ['Commissioning and diagnostics for Kellogg’s, Bimbo and Intuitive Surgical.', 'Kellogg’s、Bimbo、Intuitive Surgical の立ち上げと診断。', '为 Kellogg’s、Bimbo 和 Intuitive Surgical 提供调试与诊断。'],
    'x3.b': ['Allen-Bradley PLCs, drives, robot integration, ROS 2 and computer vision.', 'Allen-Bradley PLC、インバータ、ロボット統合、ROS 2、コンピュータビジョン。', 'Allen-Bradley PLC、变频器、机器人集成、ROS 2 和计算机视觉。'],
    'xp.skills': ['Skills', 'スキル', '技能'],
    's1': ['Robotics', 'ロボット工学', '机器人'],
    's2': ['Automation', 'オートメーション', '自动化'],
    's3': ['AI and AI Physics', 'AI と AI Physics', 'AI 与 AI Physics'],
    's4': ['Quantum', '量子', '量子'],
    's6': ['Leadership', 'リーダーシップ', '领导力'],
    'tag.vfd': ['Drives (VFD)', 'インバータ', '变频器'],
    'tag.pid': ['PID control', 'PID 制御', 'PID 控制'],
    'tag.teams': ['Multidisciplinary teams', '多分野チーム', '跨学科团队'],
    'tag.product': ['Product', 'プロダクト', '产品'],
    'tag.partners': ['Partnerships', 'アライアンス', '合作'],

    'lg.crumbs': ['Sheet 07 <span>&gt;</span> <b>Patent and awards</b>', 'シート07 <span>&gt;</span> <b>特許と受賞</b>', '图纸 07 <span>&gt;</span> <b>专利与奖项</b>'],
    'lg.h': ['Patent and awards', '特許と受賞', '专利与奖项'],
    'lg.p': ['A patent application and some of the most relevant entrepreneurship competitions in Mexico.', '特許出願と、メキシコで最も重要な起業コンテストでの実績。', '一项专利申请，以及墨西哥最具影响力的几项创业竞赛成绩。'],
    'pt.crumbs': ['Lead inventor <span>&gt;</span> <b>AGUA VIVA project</b>', '筆頭発明者 <span>&gt;</span> <b>AGUA VIVA プロジェクト</b>', '第一发明人 <span>&gt;</span> <b>AGUA VIVA 项目</b>'],
    'pt.h': ['Desalination using a selective-adsorption, electro-responsive hydrogel (HER-DS1)', '選択吸着型電気応答性ハイドロゲルによる淡水化（HER-DS1）', '基于选择性吸附电响应水凝胶的海水淡化（HER-DS1）'],
    'pt.1b': ['Zero liquid discharge', '液体排出ゼロ', '零液体排放'],
    'pt.1s': ['Desalinates without producing toxic brine.', '有害な塩水を出さずに淡水化します。', '淡化过程中不产生有毒卤水。'],
    'pt.2b': ['Scientific backing', '科学的な裏付け', '科学背书'],
    'pt.2s': ['Technical feasibility opinion from UNAM.', 'UNAM による技術的実現可能性の見解。', '获得 UNAM 的技术可行性评估意见。'],
    'pt.3b': ['Nominations', '応募', '参评'],
    'pt.3s': ['IMPI 2025 Award and Cleantech Challenge México 2025.', 'IMPI 2025 賞、Cleantech Challenge México 2025。', 'IMPI 2025 奖和 Cleantech Challenge México 2025。'],
    'pt.alt': ['HERDS-1 website: autonomous rovers that sow a patented hydrogel', 'HERDS-1 のサイト：特許ハイドロゲルをまく自律ローバー', 'HERDS-1 网站：播撒专利水凝胶的自主漫游车'],
    'pt.cap': ['HERDS-1: agrotech rovers that sow the patented hydrogel', 'HERDS-1：特許ハイドロゲルをまく農業ローバー', 'HERDS-1：播撒专利水凝胶的农业科技漫游车'],
    'pt.tb1': ['Application MX/A/2025/012269 · pending', '出願番号 MX/A/2025/012269 · 審査中', '申请号 MX/A/2025/012269 · 审查中'],
    'pt.tb2': ['Aug 7, 2025', '2025年8月7日', '2025年8月7日'],
    'pt.tb3': ['View CAD model →', 'CADモデルを見る →', '查看 CAD 模型 →'],
    'aw.n': ['1<sup>st</sup>', '1<sup>位</sup>', '第1<sup>名</sup>'],
    'aw.p': ['Place nationally', '全国大会', '全国'],
    'aw.tb': ['POSiBLE Bécalos Challenge · scholarship', 'POSiBLE Bécalos チャレンジ · 奨学金', 'POSiBLE Bécalos 挑战赛 · 奖学金'],
    'aw.1b': ['POSiBLE National Camp', 'POSiBLE 全国キャンプ', 'POSiBLE 全国训练营'],
    'aw.1s': ['One of 7 projects from Baja California among 31,000+ applications', '31,000件以上の応募からバハカリフォルニア州の7件に選出', '从 31,000 多份申请中入选的 7 个下加州项目之一'],
    'aw.2b': ['3<sup>rd</sup> place statewide', '州大会 3<sup>位</sup>', '州级第 3<sup>名</sup>'],
    'aw.3s': ['Program for AI startups', 'AIスタートアップ向けプログラム', 'AI 创业公司计划'],
    'aw.4b': ['Entrepreneurial Leader', '起業家リーダー', '创业领袖'],
    'aw.4s': ['Líderes del Éxito magazine', 'Líderes del Éxito 誌', '《Líderes del Éxito》杂志'],
    'aw.5b': ['Founding member', '創設メンバー', '创始成员'],

    'pr.crumbs': ['Sheet 08 <span>&gt;</span> <b>Press</b>', 'シート08 <span>&gt;</span> <b>メディア</b>', '图纸 08 <span>&gt;</span> <b>媒体报道</b>'],
    'pr.h': ['In the media', 'メディア掲載', '媒体报道'],
    'pr.p': ['Articles and interviews about Qubiko, CultivaTec and free robotics for kids.', 'Qubiko、CultivaTec、子ども向け無料ロボット教室に関する記事とインタビュー。', '关于 Qubiko、CultivaTec 和儿童免费机器人教育的报道与采访。'],
    'pr.d1': ['Oct 20, 2026', '2026年10月20日', '2026年10月20日'],
    'pr.d2': ['Oct 11, 2026', '2026年10月11日', '2026年10月11日'],
    'pr.d3': ['Jun 10, 2026', '2026年6月10日', '2026年6月10日'],
    'pr.d4': ['Oct 2026', '2026年10月', '2026年10月'],
    'pr.lang': ['Article in Spanish', 'スペイン語の記事', '西班牙语报道'],
    'pr.read': ['Read article', '記事を読む', '阅读报道'],
    'pr.h4': ['Qubiko on Canal 66: robotics, programming and AI for more kids and teens', 'Canal 66 に Qubiko が出演：より多くの子どもと若者にロボット・プログラミング・AIを', 'Qubiko 登上 Canal 66：让更多青少年接触机器人、编程与 AI'],
    'pr.li': ['View on LinkedIn', 'LinkedIn で見る', '在 LinkedIn 上查看'],

    'ce.crumbs': ['Sheet 09 <span>&gt;</span> <b>Education and certifications</b>', 'シート09 <span>&gt;</span> <b>学歴と資格</b>', '图纸 09 <span>&gt;</span> <b>教育与认证</b>'],
    'ce.p': ['Mechatronics Engineering (UPBC) and Renewable Energy Engineering (UABC). Native Spanish, intermediate technical English.', 'メカトロニクス工学（UPBC）、再生可能エネルギー工学（UABC）。スペイン語ネイティブ、技術英語は中級。', '机电一体化工程（UPBC）与可再生能源工程（UABC）。母语西班牙语，技术英语中级。'],
    'ce.mit': ['Mar 25, 2026', '2026年3月25日', '2026年3月25日'],
    'ce.fanuc': ['Industrial robot operation and programming', '産業用ロボットの操作とプログラミング', '工业机器人操作与编程'],
    'ce.fanucm': ['80 h · intermediate · ID FA-2026-0625-87341', '80時間 · 中級 · ID FA-2026-0625-87341', '80 小时 · 中级 · ID FA-2026-0625-87341'],
    'ce.adv': ['Advanced', '上級', '高级'],
    'ce.badge': ['Badge', 'バッジ', '徽章'],
    'ce.verify': ['Verify on Credly ↗', 'Credly で確認 ↗', '在 Credly 上验证 ↗'],
    'ce.hr': ['Nov 22, 2025 · ID D048DFF16CD7', '2025年11月22日 · ID D048DFF16CD7', '2025年11月22日 · ID D048DFF16CD7'],
    'ce.sw': ['Certified associate and professional in mechanical design', '機械設計アソシエイト／プロフェッショナル', '机械设计助理与专业认证'],
    'ce.plc': ['PLC programming', 'PLC プログラミング', 'PLC 编程'],
    'ce.plcm': ['Programmable logic controllers', 'プログラマブルロジックコントローラ', '可编程逻辑控制器'],

    'co.crumbs': ['Sheet 10 <span>&gt;</span> <b>Contact</b>', 'シート10 <span>&gt;</span> <b>お問い合わせ</b>', '图纸 10 <span>&gt;</span> <b>联系</b>'],
    'co.h': ['Let’s build what’s next', '次のものを一緒につくろう', '一起打造下一个作品'],
    'co.p': ['Robotics projects, partnerships, talks and mentoring for entrepreneurs in Baja California.', 'ロボットプロジェクト、提携、講演、そしてバハカリフォルニアの起業家へのメンタリング。', '机器人项目、合作、演讲，以及为下加州创业者提供的辅导。'],
    'co.t1': ['Idea validation and MVP', 'アイデア検証と MVP', '想法验证与 MVP'],
    'co.t2': ['Applied AI', 'AI の実装', '应用 AI'],
    'co.t3': ['Robotics and hardware', 'ロボットとハードウェア', '机器人与硬件'],
    'co.t4': ['Pitch and calls for applications', 'ピッチと公募', '路演与项目申报'],
    'co.mail': ['Email', 'メール', '邮箱'],
    'co.phone': ['Phone', '電話', '电话'],

    'cad.canvas': ['3D view of the assembly. Drag to rotate, use the wheel or pinch to zoom and tap a part to select it.', 'アセンブリの3D表示。ドラッグで回転、ホイールかピンチでズーム、部品をタップで選択。', '装配体 3D 视图。拖动旋转，滚轮或双指缩放，点击零件进行选择。'],
    'cad.views': ['Views', 'ビュー', '视图'],
    'cad.front': ['Front', '正面', '正视'],
    'cad.side': ['Side', '側面', '侧视'],
    'cad.top': ['Top', '上面', '俯视'],
    'cad.hint': ['Drag to rotate · wheel or pinch to zoom · tap a part', 'ドラッグで回転 · ホイール/ピンチでズーム · 部品をタップ', '拖动旋转 · 滚轮或双指缩放 · 点击零件'],
    'cad.spin': ['Auto-spin', '自動回転', '自动旋转'],
    'cad.dims': ['Dimensions', '寸法', '尺寸'],
    'cad.fit': ['Fit', '全体表示', '适配视图'],
    'cad.no': ['No.', 'No.', '序号'],
    'cad.part': ['Part', '部品', '零件'],
    'cad.mat': ['Material', '材料', '材料'],
    'cad.qty': ['Qty', '数量', '数量'],
  };

  // Frases que generan los scripts (texto original en español → [inglés, japonés, chino])
  const P = {
    'Copiar': ['Copy', 'コピー', '复制'], 'Copiado': ['Copied', 'コピーしました', '已复制'], 'Seleccionado': ['Selected', '選択しました', '已选中'],
    'Brazo de 6 ejes': ['6-axis arm', '6軸アーム', '六轴机械臂'], 'Robot delta': ['Delta robot', 'デルタロボット', 'Delta 机器人'],
    'Robot SCARA': ['SCARA robot', 'SCARAロボット', 'SCARA 机器人'], 'Robot móvil AMR': ['AMR mobile robot', '移動ロボット AMR', 'AMR 移动机器人'],
    'Dron de inventario': ['Inventory drone', '在庫管理ドローン', '盘点无人机'],
    '{n} piezas · {k} números de parte': ['{n} parts · {k} part numbers', '部品 {n} 点 · 品番 {k} 種', '{n} 个零件 · {k} 个零件号'],
    'Escala {s} · envolvente {e}': ['Scale {s} · envelope {e}', '縮尺 {s} · 外形 {e}', '比例 {s} · 外形尺寸 {e}'],
    'Visor CAD': ['CAD viewer', 'CADビューア', 'CAD 查看器'], 'Ensamble completo': ['Full assembly', '全体アセンブリ', '完整装配体'],
    'Piezas': ['Parts', '部品数', '零件'], '{a} en {b} números de parte': ['{a} in {b} part numbers', '{a} 点（品番 {b} 種）', '{a} 个，共 {b} 个零件号'],
    'Envolvente': ['Envelope', '外形寸法', '外形尺寸'], 'Escala': ['Scale', '縮尺', '比例'], 'Pieza {a} de {b}': ['Part {a} of {b}', '部品 {a} / {b}', '零件 {a} / {b}'],
    'Material': ['Material', '材料', '材料'], 'Proceso': ['Process', '加工法', '工艺'], 'Cantidad': ['Quantity', '数量', '数量'], 'c/u': ['each', '各', '每件'],
    'Explosionar': ['Explode', '分解', '爆炸视图'], 'Ensamblar': ['Assemble', '組立', '装配'],
    'Proyecto': ['Project', 'プロジェクト', '项目'], 'Lámina': ['Sheet', '図面', '图号'], 'Unidades': ['Units', '単位', '单位'], 'Autor': ['Author', '作成者', '作者'],
    'En pausa': ['Paused', '一時停止中', '已暂停'], 'Política estable · empújalo': ['Stable policy · push it', '方策が安定 · 押してみて', '策略已稳定 · 推它试试'],
    'Sin entrenar': ['Untrained', '未学習', '未训练'], 'Aprendiendo': ['Learning', '学習中', '学习中'], 'Pausar': ['Pause', '一時停止', '暂停'], 'Reanudar': ['Resume', '再開', '继续'],
    'θ(t) · últimos 6 s': ['θ(t) · last 6 s', 'θ(t) · 直近6秒', 'θ(t) · 最近 6 秒'], 'Recompensa por generación': ['Reward per generation', '世代ごとの報酬', '每代奖励'],
    'Recompensa': ['Reward', '報酬', '奖励'], 'Empuje': ['Push', '外乱', '推力'], 'Caída · reinicio': ['Fall · reset', '転倒 · リセット', '摔倒 · 重置'],
    // diseños
    'Celda robótica de manufactura': ['Robotic manufacturing cell', 'ロボット製造セル', '机器人制造单元'], 'Brazo robótico de 6 ejes': ['6-axis robotic arm', '6軸ロボットアーム', '六轴机械臂'],
    'Rover de exploración 6×6': ['6×6 exploration rover', '6×6 探査ローバー', '6×6 探测漫游车'], 'Cohete sonda experimental': ['Experimental sounding rocket', '実験用観測ロケット', '实验探空火箭'],
    'Robot de fútbol BRL': ['BRL soccer robot', 'BRL サッカーロボット', 'BRL 足球机器人'], 'Módulo de celdas HER-DS1': ['HER-DS1 cell module', 'HER-DS1 セルモジュール', 'HER-DS1 单元模块'],
    'Manufactura flexible · Proyecto ITM': ['Flexible manufacturing · ITM project', 'フレキシブル生産 · ITM プロジェクト', '柔性制造 · ITM 项目'],
    'Robótica industrial · Estudio de diseño': ['Industrial robotics · Design study', '産業用ロボット · 設計スタディ', '工业机器人 · 设计研究'],
    'Vehículos · Estudio de diseño': ['Vehicles · Design study', '車両 · 設計スタディ', '车辆 · 设计研究'],
    'Aeroespacial · Estudio de diseño': ['Aerospace · Design study', '航空宇宙 · 設計スタディ', '航空航天 · 设计研究'],
    'Robótica de competencia · Baja Robotics League': ['Competition robotics · Baja Robotics League', '競技ロボット · Baja Robotics League', '竞赛机器人 · Baja Robotics League'],
    'Agua · Patente en trámite': ['Water · Patent pending', '水 · 特許出願中', '水资源 · 专利申请中'],
    'Representación 3D de la celda. Los planos originales se hicieron en SolidWorks y AutoCAD.': ['3D representation of the cell. The original drawings were made in SolidWorks and AutoCAD.', 'セルの3D表現。元の図面は SolidWorks と AutoCAD で作成しました。', '该单元的 3D 表示。原始图纸使用 SolidWorks 和 AutoCAD 绘制。'],
    'Estudio de diseño. La cinemática inversa de este mismo modelo mueve los robots del inicio.': ['Design study. The inverse kinematics of this same model drives the robots on the home page.', '設計スタディ。このモデルの逆運動学がトップページのロボットを動かしています。', '设计研究。首页机器人正是由该模型的逆运动学驱动。'],
    'Estudio de diseño de un rover con suspensión rocker-bogie para terreno irregular.': ['Design study of a rover with rocker-bogie suspension for rough terrain.', '不整地向けロッカー・ボギー式ローバーの設計スタディ。', '摇臂-转向架悬挂崎岖地形漫游车的设计研究。'],
    'Estudio de diseño de un cohete sonda de dos secciones con su torre de lanzamiento.': ['Design study of a two-section sounding rocket with its launch tower.', '発射塔付き2段式観測ロケットの設計スタディ。', '带发射塔的两段式探空火箭设计研究。'],
    'Chasis para la categoría de robofútbol, controlado con la app BRL Control Pro.': ['Chassis for the robot soccer category, controlled with the BRL Control Pro app.', 'ロボットサッカー部門向けシャーシ。BRL Control Pro アプリで操作します。', '用于机器人足球项目的底盘，由 BRL Control Pro 应用控制。'],
    'Modelo conceptual con geometría ilustrativa. El diseño detallado está protegido en la solicitud de patente MX/A/2025/012269.': ['Conceptual model with illustrative geometry. The detailed design is protected in patent application MX/A/2025/012269.', '説明用の形状による概念モデル。詳細設計は特許出願 MX/A/2025/012269 で保護されています。', '几何形状仅作示意的概念模型。详细设计受专利申请 MX/A/2025/012269 保护。'],
    // piezas
    'Robot industrial de 6 ejes': ['6-axis industrial robot', '6軸産業用ロボット', '六轴工业机器人'], 'Pedestal del robot': ['Robot pedestal', 'ロボット台座', '机器人底座'],
    'Centro de maquinado CNC': ['CNC machining center', 'CNCマシニングセンタ', 'CNC 加工中心'], 'Banda transportadora': ['Conveyor', 'コンベヤ', '输送带'],
    'Mesa de fixtures': ['Fixture table', '治具テーブル', '夹具台'], 'Pieza de trabajo': ['Workpiece', 'ワーク', '工件'],
    'Tablero de control con PLC': ['PLC control cabinet', 'PLC 制御盤', 'PLC 控制柜'], 'Guarda perimetral': ['Perimeter guard', '周囲安全柵', '周边护栏'],
    'Cortina de luz de seguridad': ['Safety light curtain', '安全ライトカーテン', '安全光幕'],
    'Base': ['Base', 'ベース', '底座'], 'Torreta J1': ['J1 turret', 'J1 旋回部', 'J1 转台'], 'Servomotor J2 con reductor': ['J2 servomotor with reducer', '減速機付き J2 サーボモータ', '带减速器的 J2 伺服电机'],
    'Brazo J2': ['J2 arm', 'J2 アーム', 'J2 大臂'], 'Carcasa J3 con contrapeso': ['J3 housing with counterweight', 'カウンターウェイト付き J3 ハウジング', '带配重的 J3 壳体'],
    'Antebrazo J4': ['J4 forearm', 'J4 前腕', 'J4 小臂'], 'Muñeca J5': ['J5 wrist', 'J5 手首', 'J5 手腕'], 'Brida J6 ISO 9409': ['ISO 9409 J6 flange', 'ISO 9409 J6 フランジ', 'ISO 9409 J6 法兰'],
    'Cuerpo de pinza': ['Gripper body', 'グリッパ本体', '夹爪本体'], 'Dedo de pinza': ['Gripper finger', 'グリッパの指', '夹爪手指'],
    'Chasis': ['Chassis', 'シャーシ', '底盘'], 'Placa superior': ['Top plate', '上部プレート', '顶板'],
    'Bahía electrónica (ESP32 y drivers)': ['Electronics bay (ESP32 and drivers)', '電装ベイ（ESP32 とドライバ）', '电子舱（ESP32 与驱动器）'],
    'Panel solar': ['Solar panel', 'ソーラーパネル', '太阳能板'], 'Mástil con cámara': ['Camera mast', 'カメラマスト', '相机桅杆'], 'Antena': ['Antenna', 'アンテナ', '天线'],
    'Brazo frontal de 2 GDL': ['2-DOF front arm', '2自由度の前部アーム', '二自由度前臂'], 'Balancín (rocker)': ['Rocker', 'ロッカー', '摇臂'], 'Bogie': ['Bogie', 'ボギー', '转向架'],
    'Eje y buje': ['Axle and hub', '車軸とハブ', '轴与轮毂'], 'Rueda': ['Wheel', '車輪', '车轮'],
    'Ojiva': ['Nose cone', 'ノーズコーン', '整流罩'], 'Bahía de aviónica': ['Avionics bay', 'アビオニクスベイ', '航电舱'], 'Etapa superior': ['Upper stage', '上段', '上面级'],
    'Acople entre etapas': ['Interstage coupler', '段間カプラ', '级间连接器'], 'Etapa inferior y tubo de motor': ['Lower stage and motor tube', '下段とモータチューブ', '下面级与发动机管'],
    'Aleta': ['Fin', 'フィン', '尾翼'], 'Tobera': ['Nozzle', 'ノズル', '喷管'], 'Soporte de lanzamiento': ['Launch mount', '発射台座', '发射支架'],
    'Plataforma con línea de servicio': ['Pad with service line', '供給ライン付き発射台', '带供给管路的发射平台'], 'Torre de lanzamiento': ['Launch tower', '発射塔', '发射塔'],
    'Brazo umbilical': ['Umbilical arm', 'アンビリカルアーム', '脐带臂'],
    'Tarjeta ESP32': ['ESP32 board', 'ESP32 ボード', 'ESP32 板'], 'Separador M3': ['M3 standoff', 'M3 スペーサ', 'M3 支撑柱'], 'Placa base': ['Base plate', 'ベースプレート', '底板'],
    'Motorreductor': ['Gear motor', 'ギヤードモータ', '减速电机'], 'Batería LiPo 2S': ['2S LiPo battery', '2S リポバッテリー', '2S 锂聚合物电池'],
    'Solenoide de pateo': ['Kicker solenoid', 'キック用ソレノイド', '踢球电磁铁'], 'Pateador': ['Kicker', 'キッカー', '踢球器'], 'Rueda loca': ['Caster wheel', 'キャスター', '万向轮'],
    'Balón (referencia)': ['Ball (reference)', 'ボール（参考）', '球（参考）'],
    'Placa extrema': ['End plate', 'エンドプレート', '端板'], 'Tirante con tuercas': ['Tie rod with nuts', 'ナット付きタイロッド', '带螺母的拉杆'], 'Electrodo': ['Electrode', '電極', '电极'],
    'Terminal eléctrica': ['Electrical terminal', '電気端子', '电气端子'], 'Junta de sellado': ['Sealing gasket', 'シールガスケット', '密封垫'],
    'Cámara de hidrogel electro-responsivo': ['Electro-responsive hydrogel chamber', '電気応答性ハイドロゲル室', '电响应水凝胶腔室'],
    'Puerto de entrada o salida': ['Inlet or outlet port', '入口・出口ポート', '进出口接口'],
    // materiales
    'Ensamble comercial': ['Commercial assembly', '市販アセンブリ', '外购组件'], 'Acero A36': ['A36 steel', 'A36 鋼', 'A36 钢'], 'Perfil de aluminio': ['Aluminum extrusion', 'アルミ押出材', '铝型材'],
    'Aluminio 6061': ['Aluminum 6061', 'アルミ 6061', '铝 6061'], 'Lámina calibre 14': ['14-gauge sheet steel', '14ゲージ鋼板', '14 号钢板'], 'Malla de acero': ['Steel mesh', 'スチールメッシュ', '钢丝网'],
    'Fundición de aluminio': ['Cast aluminum', 'アルミ鋳物', '铸铝'], 'Aluminio 7075': ['Aluminum 7075', 'アルミ 7075', '铝 7075'], 'Acero inoxidable': ['Stainless steel', 'ステンレス鋼', '不锈钢'],
    'Acero 4140': ['4140 steel', '4140 鋼', '4140 钢'], 'Aluminio 5052': ['Aluminum 5052', 'アルミ 5052', '铝 5052'], 'Silicio monocristalino': ['Monocrystalline silicon', '単結晶シリコン', '单晶硅'],
    'Aluminio y PETG': ['Aluminum and PETG', 'アルミと PETG', '铝与 PETG'], 'Fibra de vidrio': ['Fiberglass', 'ガラス繊維', '玻璃纤维'], 'Acero 1045': ['1045 steel', '1045 鋼', '1045 钢'],
    'Aluminio 6061-T6': ['Aluminum 6061-T6', 'アルミ 6061-T6', '铝 6061-T6'], 'Fibra de carbono': ['Carbon fiber', '炭素繊維', '碳纤维'], 'Grafito': ['Graphite', '黒鉛', '石墨'],
    'Perfil de acero': ['Steel section', '形鋼', '型钢'], 'Acrílico 3 mm': ['3 mm acrylic', 'アクリル 3 mm', '3 mm 亚克力'], 'Latón': ['Brass', '真鍮', '黄铜'],
    'Acrílico 5 mm': ['5 mm acrylic', 'アクリル 5 mm', '5 mm 亚克力'], 'Acero': ['Steel', '鋼', '钢'], 'Polímero de ingeniería': ['Engineering polymer', 'エンジニアリングポリマー', '工程聚合物'],
    'Conductor (según patente)': ['Conductor (per patent)', '導電体（特許による）', '导体（依据专利）'], 'Cobre': ['Copper', '銅', '铜'], 'Elastómero': ['Elastomer', 'エラストマー', '弹性体'],
    'Hidrogel en marco polimérico': ['Hydrogel in a polymer frame', 'ポリマー枠入りハイドロゲル', '聚合物框架内的水凝胶'], 'Polímero': ['Polymer', 'ポリマー', '聚合物'],
    // procesos
    'Integración': ['Integration', '統合', '集成'], 'Soldadura y maquinado': ['Welding and machining', '溶接と機械加工', '焊接与机加工'], 'Ensamble': ['Assembly', '組立', '装配'],
    'Maquinado': ['Machining', '機械加工', '机加工'], 'Maquinado CNC': ['CNC machining', 'CNC 加工', 'CNC 加工'], 'Ensamble eléctrico': ['Electrical assembly', '電気組立', '电气装配'],
    'Modular atornillada': ['Modular, bolted', 'モジュール式ボルト締め', '模块化螺栓连接'], 'Fundición y maquinado': ['Casting and machining', '鋳造と機械加工', '铸造与机加工'],
    'Torneado': ['Turning', '旋盤加工', '车削'], 'Corte láser y doblez': ['Laser cutting and bending', 'レーザー切断と曲げ', '激光切割与折弯'], 'Corte láser': ['Laser cutting', 'レーザー切断', '激光切割'],
    'Impresión 3D': ['3D printing', '3Dプリント', '3D 打印'], 'Comercial': ['Off-the-shelf', '市販品', '外购'], 'Torneado e impresión 3D': ['Turning and 3D printing', '旋盤加工と3Dプリント', '车削与 3D 打印'],
    'Router CNC': ['CNC routing', 'CNC ルーター加工', 'CNC 雕铣'], 'Laminado en molde': ['Mold lay-up', '型積層', '模具铺层'], 'Torneado CNC': ['CNC turning', 'CNC 旋盤加工', 'CNC 车削'],
    'Enrollado de filamento': ['Filament winding', 'フィラメントワインディング', '纤维缠绕'], 'Soldadura': ['Welding', '溶接', '焊接'],
    'Corte láser y soldadura': ['Laser cutting and welding', 'レーザー切断と溶接', '激光切割与焊接'], 'Corte y doblez': ['Cutting and bending', '切断と曲げ', '切割与折弯'],
    'Conceptual': ['Conceptual', '概念', '概念'],
  };

  const IDX = { en: 0, ja: 1, zh: 2 };
  const nodes = [...document.querySelectorAll('[data-i18n]')];
  nodes.forEach(el => { el._es = el.innerHTML; });
  const attrNodes = [...document.querySelectorAll('[data-i18n-attr]')].map(el => ({
    el, pairs: el.dataset.i18nAttr.split(';').map(p => { const [attr, key] = p.split(':'); return { attr, key, es: el.getAttribute(attr) }; }),
  }));
  const esByKey = {};
  nodes.forEach(el => { if (!(el.dataset.i18n in esByKey)) esByKey[el.dataset.i18n] = el._es; });
  attrNodes.forEach(n => n.pairs.forEach(p => { if (!(p.key in esByKey)) esByKey[p.key] = p.es; }));

  let lang = 'es';
  const t = (key) => {
    if (lang !== 'es' && K[key]) return K[key][IDX[lang]];
    return esByKey[key] != null ? esByKey[key] : key;
  };
  const tr = (phrase, vars) => {
    let s = lang !== 'es' && P[phrase] ? P[phrase][IDX[lang]] : phrase;
    if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  };

  const fontsLoaded = {};
  function loadFont(l) {
    if (!FONTS[l] || fontsLoaded[l]) return;
    fontsLoaded[l] = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = FONTS[l];
    document.head.appendChild(link);
  }

  const sel = document.getElementById('langSel');
  const idxBtns = [...document.querySelectorAll('[data-lang]')];
  function apply(next) {
    lang = LANGS.includes(next) ? next : 'es';
    nodes.forEach(el => {
      const html = lang === 'es' ? el._es : (K[el.dataset.i18n] ? K[el.dataset.i18n][IDX[lang]] : el._es);
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    attrNodes.forEach(n => n.pairs.forEach(p => {
      const v = lang === 'es' ? p.es : (K[p.key] ? K[p.key][IDX[lang]] : p.es);
      if (v != null) n.el.setAttribute(p.attr, v);
    }));
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    loadFont(lang);
    if (sel) sel.value = lang;
    idxBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }
  function set(next, save = true) {
    if (save) { try { localStorage.setItem('dm-lang', next); } catch (e) {} }
    const run = () => apply(next);
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(run); else run();
  }
  function detect() {
    try { const q = new URLSearchParams(location.search).get('lang'); if (q && LANGS.includes(q)) return q; } catch (e) {}
    try { const s = localStorage.getItem('dm-lang'); if (s && LANGS.includes(s)) return s; } catch (e) {}
    const list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'es'];
    for (const l of list) { const p = String(l).toLowerCase().slice(0, 2); if (LANGS.includes(p)) return p; }
    return 'en';
  }

  window.i18n = { t, tr, set, get lang() { return lang; }, get locale() { return LOCALE[lang]; } };
  if (sel) sel.addEventListener('change', () => set(sel.value));
  idxBtns.forEach(b => b.addEventListener('click', () => set(b.dataset.lang)));
  apply(detect());
})();
