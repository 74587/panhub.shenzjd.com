/**
 * 接口地址（硬编码，指向 PanHub 官方服务）
 *
 * 本工程是 PanHub 开源的**纯静态前台**，只做两件事：
 *   1. 调 API 搜索
 *   2. 调 API「获取」（转存归因）
 * 登录交给 wx-auth 公共组件，数据由官方 API 提供。
 *
 * 为什么写死地址：搜索与「获取」是强登录接口，登录态由官方服务统一校验，
 * 换地址并不能绕过校验；写死可避免部署方误配导致页面白屏。
 */
export const API_BASE = "https://panhub.shenzjd.com/api";

/** wx-auth 公共登录服务（登录态唯一签发方） */
export const WX_AUTH_API_BASE = "https://wx-auth.shenzjd.com";

/** wx-auth-sdk UMD 包（全局单例 window.WxAuth） */
export const WX_AUTH_SDK_URL =
  "https://unpkg.com/wx-auth-sdk/dist/wx-auth.umd.js";

export const SITE_NAME = "PanHub";

/** 每轮搜索的累计结果上限（与后端默认一致：达到后出现「继续」） */
export const MAX_RESULTS_PER_ROUND = 90;
