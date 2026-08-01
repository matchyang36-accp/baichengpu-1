import type { Metadata } from "next";
import { AccountMenu } from "../../AccountMenu";
import { getAccountUser } from "../../account-auth";

export const metadata: Metadata = {
  title: "透明背景 PNG 完全指南：电商卖家需要知道的一切｜白橙铺",
  description:
    "什么是透明背景 PNG？为什么电商平台需要它？如何制作？本文用通俗的语言帮你搞懂这些概念。",
};

export const dynamic = "force-dynamic";

export default async function TransparentPngGuidePage() {
  const user = await getAccountUser();

  return (
    <main className="article-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </a>
        <nav className="nav" aria-label="文章页导航">
          <a href="/">单张抠图</a>
          <a href="/batch">批量版</a>
          <a href="/blog">使用指南</a>
          <a href="/contact">联系我们</a>
        </nav>
        <AccountMenu
          viewer={
            user
              ? { displayName: user.displayName, email: user.email }
              : null
          }
        />
      </header>

      <article>
        <section className="article-hero">
          <span className="eyebrow">基础知识</span>
          <h1>透明背景 PNG 完全指南：电商卖家需要知道的一切</h1>
          <p>发布日期：2026 年 7 月 31 日</p>
        </section>

        <div className="article-body">
          <p>
            如果你做电商，一定经常听到"透明背景 PNG"这个说法。平台要求上传透明背景的主图，设计师说需要 PNG 格式，但到底什么是透明背景？为什么不能用 JPG？怎么制作？这篇指南用最通俗的语言帮你搞懂。
          </p>

          <h2>什么是透明背景？</h2>
          <p>
            想象你有一张商品照片，背景是白色的。当你把这张图放在另一个白色背景上时，看起来没问题。但如果你的店铺装修是浅灰色，或者你想把商品图放在彩色横幅上，那个白色背景就会显得格格不入。
          </p>
          <p>
            透明背景就是去掉商品背后的那层颜色，只保留商品本身。这样你可以把商品放在任何背景上——白色、灰色、彩色、渐变——都不会出现一块突兀的白边。
          </p>
          <p>
            打个比方：透明背景就像一张只画了商品的透明贴纸，你可以把它贴在任何地方。
          </p>

          <h2>PNG 和 JPG 有什么区别？</h2>
          <p>
            这是最常被问到的问题。简单来说：
          </p>
          <ul>
            <li><strong>JPG</strong>：不支持透明背景。每像素必须有颜色，背景如果是白色就一直是白色。文件体积小，适合拍摄类照片。</li>
            <li><strong>PNG</strong>：支持透明背景。背景区域可以是"无颜色"状态（透明），放在任何背景上都能自然融合。文件体积稍大，但适合需要透明效果的图片。</li>
          </ul>
          <p>
            所以当平台要求"透明背景主图"时，你必须用 PNG 格式，因为 JPG 物理上做不到透明。
          </p>

          <h2>为什么电商平台需要透明背景图？</h2>
          <p>
            电商平台对主图有严格规范，通常要求白底图。但除了主图之外，很多场景需要透明背景图：
          </p>
          <ul>
            <li><strong>详情页设计</strong>：把商品放在各种场景背景上展示。</li>
            <li><strong>活动横幅</strong>：促销banner中嵌入商品图。</li>
            <li><strong>多平台适配</strong>：不同平台背景色不同，透明图通用。</li>
            <li><strong>品牌素材库</strong>：方便设计师复用商品素材。</li>
          </ul>
          <p>
            一张透明 PNG 相当于一个"干净的商品素材"，可以在任何设计场景中使用。
          </p>

          <h2>如何制作透明背景 PNG？</h2>
          <p>
            常见的方法有以下几种：
          </p>

          <h3>方法一：AI 自动抠图（推荐）</h3>
          <p>
            使用 AI 抠图工具（比如白橙铺），上传商品图，工具自动识别商品主体并移除背景，直接输出透明 PNG。整个过程几秒钟，不需要任何设计技能。
          </p>
          <p>
            优点：速度快、操作简单、免费。适合大多数标准商品图。
          </p>

          <h3>方法二：Photoshop 手动抠图</h3>
          <p>
            在 PS 中用魔棒、钢笔或选择工具手动勾选商品轮廓，删除背景后导出 PNG。适合对精度要求极高的场景，但耗时较长，需要一定技能。
          </p>

          <h3>方法三：绿幕拍摄</h3>
          <p>
            在拍摄阶段使用纯绿色背景，后期通过色键抠像去掉绿色。适合视频和批量拍摄场景，但需要专业设备。
          </p>

          <h2>透明 PNG 使用注意事项</h2>
          <ul>
            <li><strong>检查边缘</strong>：抠图后放大检查商品边缘是否有残留颜色或毛边。</li>
            <li><strong>保留原图</strong>：始终保留原始拍摄图，方便重新抠图或修改。</li>
            <li><strong>文件命名</strong>：透明 PNG 文件建议用 _transparent 后缀，方便和白底图区分。</li>
            <li><strong>尺寸一致</strong>：同一批商品图保持相同尺寸，方便批量上传和管理。</li>
          </ul>

          <h2>总结</h2>
          <p>
            透明背景 PNG 是电商运营中必备的图片素材格式。理解了它的原理和用途，你就能更好地规划商品图的拍摄和处理流程。如果你需要快速制作透明 PNG，试试白橙铺的 AI 抠图工具——上传图片即可，全程在浏览器本地完成。
          </p>
        </div>

        <section className="article-cta">
          <h3>需要制作透明 PNG？</h3>
          <p>上传商品图到白橙铺，AI 自动抠图，本地处理，免费下载透明 PNG。</p>
          <a className="primary-button" href="/">立即免费抠图</a>
        </section>
      </article>

      <footer>
        <span>© 2026 白橙铺</span>
        <div className="footer-links">
          <a href="/blog">更多文章</a>
          <a href="/">免费抠图</a>
          <a href="/privacy">隐私说明</a>
          <a href="/contact">联系我们</a>
        </div>
      </footer>
    </main>
  );
}
