import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");
const DB_FILE = path.join(ROOT_DIR, "ahkam.db");

let sqliteInstance = null;
let d1AdapterInstance = null;

export function createD1Adapter(sqlite) {
  return {
    prepare(sql) {
      return {
        args: [],
        bind(...args) {
          this.args = args.map((arg) => (arg === undefined ? null : arg));
          return this;
        },
        execute() {
          const statement = sqlite.prepare(sql);
          if (/^\s*(SELECT|WITH|PRAGMA)/i.test(sql)) {
            const results = statement.all(...this.args);
            return { results, meta: { rows_read: results.length, duration: 0 } };
          }
          const info = statement.run(...this.args);
          return {
            results: [],
            meta: { changes: info.changes, last_row_id: info.lastInsertRowid },
          };
        },
        all() {
          return this.execute();
        },
        run() {
          return this.execute();
        },
        first(col) {
          const res = this.execute();
          const row = res.results?.[0];
          if (!row) return null;
          return col ? row[col] : row;
        },
      };
    },
    batch(statements) {
      return statements.map((statement) => statement.execute());
    },
  };
}

export function initDatabase(dbPath = DB_FILE) {
  if (d1AdapterInstance && dbPath === DB_FILE) return d1AdapterInstance;

  const sqlite = new DatabaseSync(dbPath);
  if (dbPath === DB_FILE) {
    sqliteInstance = sqlite;
  }

  // Base Schema
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS Courts (
      Court_ID INTEGER PRIMARY KEY,
      Court_Name TEXT
    );

    CREATE TABLE IF NOT EXISTS Judgments_Master (
      Master_ID INTEGER PRIMARY KEY,
      Court_ID INTEGER,
      Case_No INTEGER,
      Case_Year INTEGER,
      Office_Year INTEGER,
      Case_Date TEXT,
      Master_Text TEXT
    );

    CREATE TABLE IF NOT EXISTS Judgments_Text (
      Fakra_ID INTEGER PRIMARY KEY,
      Master_ID INTEGER,
      Fakra_No INTEGER,
      Fakra_Text TEXT
    );

    CREATE TABLE IF NOT EXISTS Judgments_Principles (
      Mogz_ID INTEGER PRIMARY KEY,
      Parent_ID INTEGER,
      Court_ID INTEGER,
      Mogz_Text TEXT
    );

    CREATE TABLE IF NOT EXISTS Judgments_Principles_Links (
      Mogz_ID INTEGER,
      Fakra_ID INTEGER
    );
  `);

  // Apply migrations 0001 to 0007
  const migrationsDir = path.join(ROOT_DIR, "migrations");
  const migrationFiles = [
    "0001_indexes.sql",
    "0002_search_indexes.sql",
    "0003_drop_duplicate_indexes.sql",
    "0004_normalized_judgment_fts.sql",
    "0005_search_metadata_and_integrity.sql",
    "0006_user_auth_and_saved.sql",
    "0007_trial_limit.sql",
  ];

  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file);
    if (fs.existsSync(fullPath)) {
      const sql = fs.readFileSync(fullPath, "utf8");
      try {
        sqlite.exec(sql);
      } catch (err) {
        throw new Error(`Migration failed for ${file}: ${err.message}`, { cause: err });
      }
    }
  }

  // Seed Courts if empty
  const courtCount = sqlite.prepare("SELECT COUNT(*) AS total FROM Courts").get().total;
  if (courtCount === 0) {
    const courts = [
      [1, "محكمة النقض - الدائرة المدنية والتجارية"],
      [2, "محكمة النقض - الدائرة الجنائية"],
      [3, "المحكمة الإدارية العليا - مجلس الدولة"],
      [4, "المحكمة الدستورية العليا"],
      [21, "المحكمة العليا"],
      [25, "سوابق المحكمة الدستورية العليا"],
      [29, "سوابق النقض المدني"],
      [30, "سوابق النقض الجنائي"],
      [31, "محكمة القضاء الإداري - مجلس الدولة"],
      [35, "أحكام الدعم والإغراق"],
      [36, "سوابق القضاء الإداري"],
      [37, "سوابق المحكمة الإدارية العليا"],
      [47, "أحكام المحكمة الإدارية"],
    ];

    const insertCourt = sqlite.prepare("INSERT OR REPLACE INTO Courts (Court_ID, Court_Name) VALUES (?, ?)");
    for (const [id, name] of courts) {
      insertCourt.run(id, name);
    }

    seedJudgments(sqlite);
  }

  const adapter = createD1Adapter(sqlite);
  if (dbPath === DB_FILE) {
    d1AdapterInstance = adapter;
  }
  return adapter;
}

function seedJudgments(sqlite) {
  const sampleJudgments = [
    {
      master: {
        Master_ID: 1,
        Court_ID: 1,
        Case_No: 95,
        Case_Year: 18,
        Office_Year: null,
        Case_Date: "1950-04-13",
        Master_Text: "الطعن رقم 95 لسنة 18 قضائية - الدائرة المدنية والتجارية - جلسة 13 أبريل 1950. شيك، مسئولية الساحب عن الوفاء بقيمته، تقادم دعوى الحامل قبل الساحب بمضي ستة أشهر من ميعاد تقديم الشيك. لا يسقط حق الحامل في الرجوع على الساحب إذا لم يقدم مقابل الوفاء حتى تمام التقادم."
      },
      texts: [
        { Fakra_ID: 101, Fakra_No: 0, Fakra_Text: "برئاسة السيد الأستاذ أحمد محمد حسن رئيس المحكمة، وبحضور حضرات الأساتذة المستشارين حسن زكي وحلمي بهجت بدوي ومصطفى فاضل." },
        { Fakra_ID: 102, Fakra_No: 1, Fakra_Text: "شيك صادر من الساحب دون تقديم مقابل وفاء كافٍ. التزام الساحب بأداء قيمته للحامل لا يسقط بالتقادم الصرفي المنصوص عليه في المادة 193 من قانون التجارة ما لم يثبت وجود المقابل." },
        { Fakra_ID: 103, Fakra_No: 2, Fakra_Text: "تثبت مسئولية الساحب عن الوفاء بقيمة الشيك لصالح الحامل حسن النية استناداً إلى التزامه الأصلي الناشئ عن سحب الورقة التجارية وقواعد الإثراء بلا سبب." },
        { Fakra_ID: 104, Fakra_No: -2, Fakra_Text: "وحيث إن الوقائع تتحصل في أن المطعون ضده أقام الدعوى طالباً إلزام الطاعن بأداء مبلغ مائة وخمسين جنيهاً قيمة شيك ارتد دون صرف لعدم كفاية الرصيد، فقضت المحكمة الابتدائية بإلزام الطاعن، واستأنف الطاعن وقضت محكمة الاستئناف بتأييد الحكم." },
        { Fakra_ID: 105, Fakra_No: -50, Fakra_Text: "فلهذه الأسباب حكمت المحكمة بقبول الطعن شكلاً وفي الموضوع برفضه، وألزمت الطاعن بالمصروفات ومصادرة الكفالة." }
      ],
      principles: [
        { Mogz_ID: 1, Parent_ID: null, Court_ID: 1, Mogz_Text: "مسئولية الساحب عن الوفاء بقيمة الشيك للحامل لا تسقط بمضي مدة التقادم الصرفي إذا لم يكن قد قدم مقابل الوفاء." }
      ],
      links: [{ Mogz_ID: 1, Fakra_ID: 102 }],
      metadata: [
        ["chamber", "الدائرة المدنية والتجارية"],
        ["type", "مدني تجاري"],
        ["category", "أوراق تجارية وشيكات"]
      ]
    },
    {
      master: {
        Master_ID: 2,
        Court_ID: 1,
        Case_No: 11,
        Case_Year: 50,
        Office_Year: null,
        Case_Date: "1981-02-17",
        Master_Text: "الطعن رقم 11 لسنة 50 قضائية - الدائرة المدنية - جلسة 17 فبراير 1981. بطلان إعلان صحيفة افتتاح الدعوى، عدم انعقاد الخصومة القانونية يترتب عليه الأثر القانوني بانعدام الحكم الصادر فيها."
      },
      texts: [
        { Fakra_ID: 201, Fakra_No: 0, Fakra_Text: "برئاسة السيد المستشار نائب رئيس المحكمة مصطفى الفقي، وعضوية السادة المستشارين محمود حسن رمضان ومحمد شهاوي." },
        { Fakra_ID: 202, Fakra_No: 1, Fakra_Text: "بطلان الإعلان يترتب عليه الأثر القانوني المتمثل في عدم انعقاد الخصومة القضائية بين طرفي النزاع، وإغفال إعلان الخصم لشخصه أو في موطنه الحقيقي يعدم الحكم الصادر في غيبته." },
        { Fakra_ID: 203, Fakra_No: 2, Fakra_Text: "صحيفة افتتاح الدعوى هي الأساس الذي تبنى عليه كافة الإجراءات التالية، وبطلان إعلانها متعلق بالنظام العام إذا ترتب عليه عدم علم المدعى عليه بالدعوى." },
        { Fakra_ID: 204, Fakra_No: -2, Fakra_Text: "وحيث إن الطاعن ينعى على الحكم المطعون فيه الخطأ في تطبيق القانون، إذ قضى بصحة إعلانه بصحيفة أول درجة مخاطباً مع جهة الإدارة دون إخطاره بكتاب مسجل بالبريد خلال الميعاد المحدد قانوناً." },
        { Fakra_ID: 205, Fakra_No: -50, Fakra_Text: "فلهذه الأسباب حكمت المحكمة بنقض الحكم المطعون فيه وإحالة القضية إلى محكمة استئناف القاهرة لنظرها مجدداً بهيئة أخرى." }
      ],
      principles: [
        { Mogz_ID: 2, Parent_ID: null, Court_ID: 1, Mogz_Text: "بطلان إعلان صحيفة الدعوى يترتب عليه زوال كل أثر للحكم الصادر فيها لعدم انعقاد الخصومة قانوناً." }
      ],
      links: [{ Mogz_ID: 2, Fakra_ID: 202 }],
      metadata: [
        ["chamber", "الدائرة المدنية"],
        ["type", "مرافعات"],
        ["category", "بطلان الإجراءات والإعلانات"]
      ]
    },
    {
      master: {
        Master_ID: 3,
        Court_ID: 2,
        Case_No: 1234,
        Case_Year: 62,
        Office_Year: null,
        Case_Date: "1994-05-12",
        Master_Text: "الطعن رقم 1234 لسنة 62 قضائية - الدائرة الجنائية - جلسة 12 مايو 1994. جريمة إصدار شيك بدون رصيد، توافر القصد الجنائي، علم الساحب بعدم وجود مقابل وفاء كافٍ وقائم للسحب في تاريخ الإصدار."
      },
      texts: [
        { Fakra_ID: 301, Fakra_No: 0, Fakra_Text: "برئاسة السيد المستشار نائب رئيس المحكمة عبد اللطيف أبو هيف، وعضوية السادة المستشارين أحمد علي خليل ومحمد عبد العزيز." },
        { Fakra_ID: 302, Fakra_No: 1, Fakra_Text: "القصد الجنائي في جريمة إصدار شيك لا يقابله رصيد قائم وقابل للسحب يتحقق بمجرد علم الساحب بعدم وجود الرصيد الكافي، ولا عبرة بالأسباب والدوافع التي دفعته لإصدار الشيك." },
        { Fakra_ID: 303, Fakra_No: 2, Fakra_Text: "الشيك ورقة تجارية تجري مجرى النقود في المعاملات، والادعاء بكونه شيك ضمان أو معلق على شرط لا ينفي عنه صفته ولا يسلب الحماية الجنائية المقررة له." },
        { Fakra_ID: 304, Fakra_No: -2, Fakra_Text: "وحيث إن النيابة العامة اتهمت الطاعن بأنه أصدر بسوء نية للمجني عليه شيكاً لا يقابله رصيد قائم وقابل للسحب، وقضت محكمة أول درجة بحبسه سنة وكفالة، وتأيد الحكم استئنافياً." },
        { Fakra_ID: 305, Fakra_No: -50, Fakra_Text: "فلهذه الأسباب حكمت المحكمة بقبول الطعن شكلاً ورفضه موضوعاً." }
      ],
      principles: [
        { Mogz_ID: 3, Parent_ID: null, Court_ID: 2, Mogz_Text: "جريمة إعطاء شيك بدون رصيد تتحقق بمجرد إعطاء الشيك مع العلم بعدم وجود مقابل وفاء له. ادعاء كونه ضماناً لا ينفي الجريمة." }
      ],
      links: [{ Mogz_ID: 3, Fakra_ID: 302 }],
      metadata: [
        ["chamber", "الدائرة الجنائية"],
        ["type", "جنائي"],
        ["category", "جرائم الشيكات والأموال"]
      ]
    },
    {
      master: {
        Master_ID: 4,
        Court_ID: 4,
        Case_No: 45,
        Case_Year: 24,
        Office_Year: null,
        Case_Date: "2002-11-03",
        Master_Text: "القضية رقم 45 لسنة 24 قضائية دستورية - المحكمة الدستورية العليا - جلسة 3 نوفمبر 2002. دستورية، حماية حق الملكية الخاصة والتضامن الاجتماعي، عدم دستورية الامتداد القانوني لعقد إيجار الأماكن لغير جيل واحد من المستفيدين المقيمين مع المستأجر الأصلي."
      },
      texts: [
        { Fakra_ID: 401, Fakra_No: 0, Fakra_Text: "برئاسة السيد المستشار الدكتور فتحي فكري رئيس المحكمة، وحضور السادة المستشارين ماهر البحيري ومحمد علي سيف الدين وعدلي منصور وعلي عوض صالح." },
        { Fakra_ID: 402, Fakra_No: 1, Fakra_Text: "حق الملكية الخاصة مصون بالدستور، ولا يجوز فرض قيود عليه تمس جوهره. النص على امتداد عقود الإيجار لأقارب المستأجر لا يجوز أن يمتد إلى ما لا نهاية بحيث يحرم المالك من استرداد عينه المؤجرة." },
        { Fakra_ID: 403, Fakra_No: 2, Fakra_Text: "قصر امتداد عقد الإيجار بعد وفاة المستأجر الأصلي على زوجه وأولاده وأي من والديه الذين كانوا يقيمون معه إقامة مستقرة حتى الوفاة، ولمرة واحدة فقط." },
        { Fakra_ID: 404, Fakra_No: -2, Fakra_Text: "وحيث إن الدعوى أقيمت بعد أن دفعت المدعية أمام محكمة الموضوع بعدم دستورية نص الفقرة الثالثة من المادة 29 من القانون رقم 49 لسنة 1977 في شأن تأجير وبيع الأماكن." },
        { Fakra_ID: 405, Fakra_No: -50, Fakra_Text: "فلهذه الأسباب حكمت المحكمة بعدم دستورية نص الفقرة الثالثة من المادة 29 من القانون رقم 49 لسنة 1977 فيما لم يتضمنه من النص على انتهاء عقد الإيجار بوفاة المستأجر أو تركه العين إذا لم يكن فيها زوج أو أولاد أو والدان." }
      ],
      principles: [
        { Mogz_ID: 4, Parent_ID: null, Court_ID: 4, Mogz_Text: "امتداد عقد الإيجار لجيل واحد فقط من أقارب المستأجر المقيمين معه استقراراً. عدم جواز تأبيد عقود الإيجار مساساً بالملكية الخاصة." }
      ],
      links: [{ Mogz_ID: 4, Fakra_ID: 402 }],
      metadata: [
        ["chamber", "الهيئة العامة للمحكمة الدستورية العليا"],
        ["type", "دستوري"],
        ["category", "قوانين الإيجار وحق الملكية"]
      ]
    },
    {
      master: {
        Master_ID: 5,
        Court_ID: 3,
        Case_No: 10250,
        Case_Year: 48,
        Office_Year: null,
        Case_Date: "2004-06-15",
        Master_Text: "الطعن رقم 10250 لسنة 48 قضائية عليا - المحكمة الإدارية العليا - دائرة منازعات الأفراد وهيئات القطاع العام. القرار الإداري السلبي، امتناع جهة الإدارة عن اتخاذ إجراء كان الواجب القانوني يلزمها باتخاذه، إلغاء القرار مع التعويض الكامل."
      },
      texts: [
        { Fakra_ID: 501, Fakra_No: 0, Fakra_Text: "برئاسة السيد المستشار الدكتور كمال زكي عبد الرحمن نائب رئيس مجلس الدولة ورئيس المحكمة، وعضوية السادة المستشارين فؤاد أحمد عبد الرحيم ومنير عبد القدوس." },
        { Fakra_ID: 502, Fakra_No: 1, Fakra_Text: "القرار الإداري السلبي بالامتناع يتحقق إذا رفضت جهة الإدارة أو امتنعت عن اتخاذ قرار كان من الواجب عليها قانوناً اتخاذه بناء على طلب صاحب الشأن مستوفياً شروطه." },
        { Fakra_ID: 503, Fakra_No: 2, Fakra_Text: "إلغاء القرار الإداري غير المشروع يوجب تعويض المضرور عن الأضرار المادية والأدبية التي لحقت به جراء خطأ جهة الإدارة وعنتها غير المبرر." },
        { Fakra_ID: 504, Fakra_No: -2, Fakra_Text: "وحيث إن الطاعن أقام دعواه بطلب الحكم بإلغاء قرار وزير الإسكان السلبي بالامتناع عن منحه ترخيص البناء المطلوب مع التعويض، وأصدرت محكمة القضاء الإداري حكمها لصالح الطاعن فطعنت الجهة الإدارية." },
        { Fakra_ID: 505, Fakra_No: -50, Fakra_Text: "فلهذه الأسباب حكمت المحكمة بقبول الطعن شكلاً ورفضه موضوعاً، وألزمت الجهة الإدارية الطاعنة المصروفات." }
      ],
      principles: [
        { Mogz_ID: 5, Parent_ID: null, Court_ID: 3, Mogz_Text: "امتناع جهة الإدارة عن إصدار قرار أوجب القانون إصداره يشكل قراراً إدارياً سلبياً مخالفاً للقانون يستوجب الإلغاء والتعويض." }
      ],
      links: [{ Mogz_ID: 5, Fakra_ID: 502 }],
      metadata: [
        ["chamber", "دائرة الحقوق والحريات"],
        ["type", "إداري منازعات أفراد"],
        ["category", "القرارات الإدارية والتعويض"]
      ]
    },
    {
      master: {
        Master_ID: 6,
        Court_ID: 31,
        Case_No: 512,
        Case_Year: 55,
        Office_Year: null,
        Case_Date: "2008-01-22",
        Master_Text: "الدعوى رقم 512 لسنة 55 قضائية - محكمة القضاء الإداري - الدائرة الأولى حقوق وحريات. ركن الجدية وركن الاستعجال في طلبات وقف تنفيذ القرارات الإدارية، سلطة القاضي الإداري في الرقابة على مشروعية السبب وصحة الوقائع."
      },
      texts: [
        { Fakra_ID: 601, Fakra_No: 0, Fakra_Text: "برئاسة السيد المستشار محمد أحمد الحسيني نائب رئيس مجلس الدولة ورئيس المحكمة، وحضور السيد المستشار الدكتور حسن عبد المنعم مفوض الدولة." },
        { Fakra_ID: 602, Fakra_No: 1, Fakra_Text: "سلطة القاضي الإداري في وقف تنفيذ القرار الإداري مشروطة بتوافر ركنين: ركن الجدية برجحان إلغاء القرار، وركن الاستعجال بأن يترتب على التنفيذ نتائج يتعذر تداركها." },
        { Fakra_ID: 603, Fakra_No: 2, Fakra_Text: "الرقابة القضائية على ركن السبب في القرار الإداري تمتد إلى التحقق من وجود الوقائع المادية التي بني عليها وصحة تكييفها القانوني وسلامة استخلاص النتيجة." },
        { Fakra_ID: 604, Fakra_No: -2, Fakra_Text: "وحيث إن المدعي يطلب الحكم بصفة مستعجلة بوقف تنفيذ القرار المطعون فيه الصادر بهدم عقاره بدعوى خطورته الداهمة دون استناد إلى تقرير هندسي سليم." },
        { Fakra_ID: 605, Fakra_No: -50, Fakra_Text: "فلهذه الأسباب حكمت المحكمة بوقف تنفيذ القرار المطعون فيه وأمرت بإحالة الدعوى إلى هيئة مفوضي الدولة لإعداد تقرير بالرأي القانوني في الموضوع." }
      ],
      principles: [
        { Mogz_ID: 6, Parent_ID: null, Court_ID: 31, Mogz_Text: "توافر ركني الجدية والاستعجال يوجب وقف تنفيذ القرار الإداري درءاً لنتائج يتعذر تداركها." }
      ],
      links: [{ Mogz_ID: 6, Fakra_ID: 602 }],
      metadata: [
        ["chamber", "الدائرة الأولى حقوق وحريات"],
        ["type", "قضاء إداري مستعجل"],
        ["category", "وقف تنفيذ القرارات الإدارية"]
      ]
    },
    {
      master: {
        Master_ID: 7,
        Court_ID: 1,
        Case_No: 342,
        Case_Year: 75,
        Office_Year: null,
        Case_Date: "2010-12-08",
        Master_Text: "الطعن رقم 342 لسنة 75 قضائية - الدائرة المدنية - جلسة 8 ديسمبر 2010. المسئولية المدنية، أركان المسئولية التقصيرية من خطأ وضرر ورابطة سببية، تقدير التعويض الجابر للضررين المادي والأدبي وسلطة محكمة الموضوع في تقديره."
      },
      texts: [
        { Fakra_ID: 701, Fakra_No: 0, Fakra_Text: "برئاسة السيد المستشار إبراهيم الضهيري نائب رئيس المحكمة، وعضوية السادة المستشارين عاطف خليل وإبراهيم نور الدين." },
        { Fakra_ID: 702, Fakra_No: 1, Fakra_Text: "المسئولية التقصيرية قوامها الخطأ والضرر وعلاقة السببية. إثبات الضرر المادي يستلزم بيان الإخلال بمصلحة مالية للمضرور، في حين يثبت الضرر الأدبي بما يصيب الشخص في شعوره أو كرامته." },
        { Fakra_ID: 703, Fakra_No: 2, Fakra_Text: "تقدير التعويض الجابر للضرر من سلطة محكمة الموضوع ما دامت قد بينت العناصر المكونة له وقامت على أسباب سائغة تكفي لحمله." },
        { Fakra_ID: 704, Fakra_No: -2, Fakra_Text: "وحيث إن الطاعنة تنعى على الحكم المطعون فيه القصور في التسبيب والفساد في الاستدلال لعدم كفاية مبلغ التعويض المقضي به لجبر ما أصابها من أضرار جراء حادث السير." },
        { Fakra_ID: 705, Fakra_No: -50, Fakra_Text: "فلهذه الأسباب حكمت المحكمة بقبول الطعن شكلاً وفي الموضوع بنقض الحكم المطعون فيه جزئياً فيما قضى به في شأن التعويض الأدبي وأحالت القضية." }
      ],
      principles: [
        { Mogz_ID: 7, Parent_ID: null, Court_ID: 1, Mogz_Text: "التعويض عن الضرر يشمل ما لحق المضرور من خسارة وما فاته من كسب. الضرر الأدبي مستقل عن الضرر المادي ويقدر بما يلائمه." }
      ],
      links: [{ Mogz_ID: 7, Fakra_ID: 702 }],
      metadata: [
        ["chamber", "الدائرة المدنية"],
        ["type", "مدني تعويضات"],
        ["category", "مسئولية مدنية وتعويض"]
      ]
    },
    {
      master: {
        Master_ID: 8,
        Court_ID: 2,
        Case_No: 789,
        Case_Year: 80,
        Office_Year: null,
        Case_Date: "2015-03-19",
        Master_Text: "الطعن رقم 789 لسنة 80 قضائية - الدائرة الجنائية - جلسة 19 مارس 2015. بطلان القبض والتفتيش لانتفاء حالة التلبس بالجريمة، عدم مشروعية الإجراء يترتب عليه بطلان كل دليل مستمد منه وفقاً لقاعدة ما بني على باطل فهو باطل."
      },
      texts: [
        { Fakra_ID: 801, Fakra_No: 0, Fakra_Text: "برئاسة السيد المستشار أنس عمارة نائب رئيس المحكمة، وعضوية السادة المستشارين فرغلي زناتي وسمير فايز ومحمد عيد." },
        { Fakra_ID: 802, Fakra_No: 1, Fakra_Text: "حالة التلبس صفة تلازم الجريمة ذاتها لا شخص مرتكبها. بطلان القبض والتفتيش لانتفاء مبرراته الدستورية والقانونية يستطيل إلى شهادة من أجراه وإلى كل دليل متفرع عنه." },
        { Fakra_ID: 803, Fakra_No: 2, Fakra_Text: "عدم جواز التعويل على الدليل المستمد من قبض باطل أو تفتيش مخالف لأحكام الدستور والقانون مهما بلغت قوة ذلك الدليل المادية." },
        { Fakra_ID: 804, Fakra_No: -2, Fakra_Text: "وحيث إن الطاعن دفع ببطلان استيقافه وضبطه وتفتيشه دون إذن من النيابة العامة أو حالة تلبس تجيز ذلك، والتفتت المحكمة عن دفاعه الجوهري وقضت بإدانته." },
        { Fakra_ID: 805, Fakra_No: -50, Fakra_Text: "فلهذه الأسباب حكمت المحكمة بنقض الحكم المطعون فيه وبراءة الطاعن مما نسب إليه ومصادرة المضبوطات." }
      ],
      principles: [
        { Mogz_ID: 8, Parent_ID: null, Court_ID: 2, Mogz_Text: "بطلان القبض والتفتيش لانتفاء حالة التلبس وإذن النيابة. بطلان الأدلة المترتبة عليهما وعدم جواز التعويل عليها في الإدانة." }
      ],
      links: [{ Mogz_ID: 8, Fakra_ID: 802 }],
      metadata: [
        ["chamber", "الدائرة الجنائية"],
        ["type", "إجراءات جنائية"],
        ["category", "بطلان القبض والتفتيش وضمانات المحاكمة"]
      ]
    }
  ];

  const insertMaster = sqlite.prepare(`
    INSERT OR REPLACE INTO Judgments_Master (Master_ID, Court_ID, Case_No, Case_Year, Office_Year, Case_Date, Master_Text)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertText = sqlite.prepare(`
    INSERT OR REPLACE INTO Judgments_Text (Fakra_ID, Master_ID, Fakra_No, Fakra_Text)
    VALUES (?, ?, ?, ?)
  `);

  const insertPrinciple = sqlite.prepare(`
    INSERT OR REPLACE INTO Judgments_Principles (Mogz_ID, Parent_ID, Court_ID, Mogz_Text)
    VALUES (?, ?, ?, ?)
  `);

  const insertLink = sqlite.prepare(`
    INSERT OR REPLACE INTO Judgments_Principles_Links (Mogz_ID, Fakra_ID)
    VALUES (?, ?)
  `);

  const insertMeta = sqlite.prepare(`
    INSERT OR REPLACE INTO Judgment_Metadata (Master_ID, Field_Name, Field_Value)
    VALUES (?, ?, ?)
  `);

  for (const j of sampleJudgments) {
    insertMaster.run(
      j.master.Master_ID,
      j.master.Court_ID,
      j.master.Case_No,
      j.master.Case_Year,
      j.master.Office_Year ?? null,
      j.master.Case_Date,
      j.master.Master_Text
    );

    for (const t of j.texts) {
      insertText.run(t.Fakra_ID, j.master.Master_ID, t.Fakra_No, t.Fakra_Text);
    }

    for (const p of j.principles) {
      insertPrinciple.run(p.Mogz_ID, p.Parent_ID ?? null, p.Court_ID, p.Mogz_Text);
    }

    for (const l of j.links) {
      insertLink.run(l.Mogz_ID, l.Fakra_ID);
    }

    for (const [fieldName, fieldValue] of j.metadata) {
      insertMeta.run(j.master.Master_ID, fieldName, fieldValue);
    }
  }

  // Populate FTS Table
  const migration0004 = path.join(ROOT_DIR, "migrations/0004_normalized_judgment_fts.sql");
  if (fs.existsSync(migration0004)) {
    sqlite.exec(fs.readFileSync(migration0004, "utf8"));
  }
}
