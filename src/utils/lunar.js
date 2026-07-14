/**
 * 农历月建、日辰、日干、日干支计算
 * 基于京房八宫纳甲理论
 */
import { TIAN_GAN, DI_ZHI, JIAZI, XUN_KONG_MAP } from '@/data/constants';

/**
 * 获取日干支
 * 基准：1900-01-01 = 甲戌日
 * @param {Date} date - 公历日期
 * @returns {{ gan: string, zhi: string }}
 *
 * 验证：
 *   2024-02-10(春节) → 甲辰日
 *   2000-01-01 → 戊午日
 */
export function getRiGanZhi(date) {
  const base = new Date(1900, 0, 1);
  const diff = Math.round((date - base) / 86400000);
  const ganIdx = ((diff % 10) + 10) % 10;
  const zhiIdx = ((10 + diff) % 12 + 12) % 12;
  return { gan: TIAN_GAN[ganIdx], zhi: DI_ZHI[zhiIdx] };
}

/**
 * 获取月建（简化：按公历月份近似）
 * 2月=寅, 3月=卯, …
 * @param {Date} date
 * @returns {string} 月建地支
 */
export function getYueJian(date) {
  return DI_ZHI[(date.getMonth() + 1) % 12];
}

/**
 * 获取起卦时间信息
 * @param {Date} [date=new Date()]
 * @returns {import('@/types').TimeInfo}
 */
export function getTimeInfo(date = new Date()) {
  const { gan, zhi } = getRiGanZhi(date);
  return {
    yueJian: getYueJian(date),
    riChen: zhi,
    riGan: gan,
    riGanZhi: gan + zhi,
  };
}

/**
 * 计算旬空
 * @param {string} riGanZhi - 日干支字符串
 * @returns {string[]} 旬空二地支
 *
 * 验证：
 *   getXunKong('甲子') → ['戌','亥']
 */
export function getXunKong(riGanZhi) {
  const idx = JIAZI.indexOf(riGanZhi);
  if (idx === -1) return [];
  const xunShou = JIAZI[idx - (idx % 10)];
  return XUN_KONG_MAP[xunShou];
}
