/**
 * 職種・地域のマスタデータ
 * フォームUI、結果表示、シードデータで共通利用する
 * データソース: doda平均年収ランキング2024-2025、厚労省賃金構造基本統計調査
 */

export const OCCUPATIONS = [
  { value: "software_engineer", label: "エンジニア・IT" },
  { value: "sales", label: "営業" },
  { value: "office_admin", label: "事務・管理" },
  { value: "marketing", label: "マーケティング・企画" },
  { value: "finance", label: "金融・保険" },
  { value: "medical", label: "医療・福祉" },
  { value: "education", label: "教育" },
  { value: "manufacturing", label: "製造・メーカー" },
  { value: "construction", label: "建設・不動産" },
  { value: "food_service", label: "飲食・サービス" },
  { value: "creative", label: "クリエイティブ" },
  { value: "civil_service", label: "公務員" },
] as const;

type RegionGroup = {
  label: string;
  prefectures: readonly { value: string; label: string }[];
};

/** 全47都道府県を地方別にグループ化 */
export const REGION_GROUPS: RegionGroup[] = [
  {
    label: "北海道・東北",
    prefectures: [
      { value: "hokkaido", label: "北海道" },
      { value: "aomori", label: "青森県" },
      { value: "iwate", label: "岩手県" },
      { value: "miyagi", label: "宮城県" },
      { value: "akita", label: "秋田県" },
      { value: "yamagata", label: "山形県" },
      { value: "fukushima", label: "福島県" },
    ],
  },
  {
    label: "関東",
    prefectures: [
      { value: "ibaraki", label: "茨城県" },
      { value: "tochigi", label: "栃木県" },
      { value: "gunma", label: "群馬県" },
      { value: "saitama", label: "埼玉県" },
      { value: "chiba", label: "千葉県" },
      { value: "tokyo", label: "東京都" },
      { value: "kanagawa", label: "神奈川県" },
    ],
  },
  {
    label: "中部",
    prefectures: [
      { value: "niigata", label: "新潟県" },
      { value: "toyama", label: "富山県" },
      { value: "ishikawa", label: "石川県" },
      { value: "fukui", label: "福井県" },
      { value: "yamanashi", label: "山梨県" },
      { value: "nagano", label: "長野県" },
      { value: "gifu", label: "岐阜県" },
      { value: "shizuoka", label: "静岡県" },
      { value: "aichi", label: "愛知県" },
    ],
  },
  {
    label: "近畿",
    prefectures: [
      { value: "mie", label: "三重県" },
      { value: "shiga", label: "滋賀県" },
      { value: "kyoto", label: "京都府" },
      { value: "osaka", label: "大阪府" },
      { value: "hyogo", label: "兵庫県" },
      { value: "nara", label: "奈良県" },
      { value: "wakayama", label: "和歌山県" },
    ],
  },
  {
    label: "中国",
    prefectures: [
      { value: "tottori", label: "鳥取県" },
      { value: "shimane", label: "島根県" },
      { value: "okayama", label: "岡山県" },
      { value: "hiroshima", label: "広島県" },
      { value: "yamaguchi", label: "山口県" },
    ],
  },
  {
    label: "四国",
    prefectures: [
      { value: "tokushima", label: "徳島県" },
      { value: "kagawa", label: "香川県" },
      { value: "ehime", label: "愛媛県" },
      { value: "kochi", label: "高知県" },
    ],
  },
  {
    label: "九州・沖縄",
    prefectures: [
      { value: "fukuoka", label: "福岡県" },
      { value: "saga", label: "佐賀県" },
      { value: "nagasaki", label: "長崎県" },
      { value: "kumamoto", label: "熊本県" },
      { value: "oita", label: "大分県" },
      { value: "miyazaki", label: "宮崎県" },
      { value: "kagoshima", label: "鹿児島県" },
      { value: "okinawa", label: "沖縄県" },
    ],
  },
];

/** 給与統計DBにない都道府県 → 近隣の代表地域にフォールバック */
export const PREFECTURE_TO_BASE_REGION: Record<string, string> = {
  // 北海道・東北 → hokkaido
  hokkaido: "hokkaido",
  aomori: "hokkaido",
  iwate: "hokkaido",
  miyagi: "hokkaido",
  akita: "hokkaido",
  yamagata: "hokkaido",
  fukushima: "hokkaido",
  // 関東
  ibaraki: "saitama",
  tochigi: "saitama",
  gunma: "saitama",
  saitama: "saitama",
  chiba: "chiba",
  tokyo: "tokyo",
  kanagawa: "kanagawa",
  // 中部
  niigata: "saitama",
  toyama: "aichi",
  ishikawa: "aichi",
  fukui: "aichi",
  yamanashi: "saitama",
  nagano: "saitama",
  gifu: "aichi",
  shizuoka: "aichi",
  aichi: "aichi",
  // 近畿
  mie: "aichi",
  shiga: "osaka",
  kyoto: "kyoto",
  osaka: "osaka",
  hyogo: "hyogo",
  nara: "osaka",
  wakayama: "osaka",
  // 中国 → osaka
  tottori: "osaka",
  shimane: "osaka",
  okayama: "osaka",
  hiroshima: "osaka",
  yamaguchi: "osaka",
  // 四国 → osaka
  tokushima: "osaka",
  kagawa: "osaka",
  ehime: "osaka",
  kochi: "osaka",
  // 九州・沖縄 → fukuoka
  fukuoka: "fukuoka",
  saga: "fukuoka",
  nagasaki: "fukuoka",
  kumamoto: "fukuoka",
  oita: "fukuoka",
  miyazaki: "fukuoka",
  kagoshima: "fukuoka",
  okinawa: "fukuoka",
};

/** 後方互換: フラットなREGIONS配列 */
export const REGIONS = REGION_GROUPS.flatMap((g) => g.prefectures);

/** value → label の逆引きマップ */
export const OCCUPATION_LABELS: Record<string, string> = Object.fromEntries(
  OCCUPATIONS.map((o) => [o.value, o.label])
);

export const REGION_LABELS: Record<string, string> = Object.fromEntries(
  REGION_GROUPS.flatMap((g) => g.prefectures).map((r) => [r.value, r.label])
);
