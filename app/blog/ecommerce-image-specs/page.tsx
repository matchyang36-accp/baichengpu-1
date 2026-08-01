import type { Metadata } from "next";
import { AccountMenu } from "../../AccountMenu";
import { getAccountUser } from "../../account-auth";

export const metadata: Metadata = {
  title: "各大电商平台主图规范汇总：尺寸、比例与白底要求｜白橙铺",
  description:
    "淘宝、京东、拼多多、亚马逊——不同平台对商品主图的要求各不相同。本文帮你一次性梳理清楚。",
};

export const dynamic = "force-dynamic";

export default async function EcommerceImageSpecsPage() {
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
          <span className="eyebrow">平台规范</span>
          <h1>各大电商平台主图规范汇总：尺寸、比例与白底要求</h1>
          <p>发布日期：2026 年 7 月 31 日</p>
        </section>

        <div className="article-body">
          <p>
            做电商运营，最头疼的事情之一就是各平台的主图规范不一样。淘宝要求的尺寸和京东不同，拼多多对白底图的规定和亚马逊也有差异。如果图片不合规，轻则影响搜索排名，重则被平台下架。
          </p>
          <p>
            本文整理了国内主流电商平台的主图规范，帮你一次性搞清楚每个平台的要求。
          </p>

          <h2>一、淘宝 / 天猫</h2>
          <p>
            淘宝和天猫的主图规范基本一致：
          </p>
          <ul>
            <li><strong>主图尺寸</strong>：建议 800×800 像素以上，最低不低于 500×500。</li>
            <li><strong>图片比例</strong>：1:1 正方形。</li>
            <li><strong>主图数量</strong>：最多 5 张，第 1 张为主图。</li>
            <li><strong>白底图要求</strong>：第 1 张主图必须为白底图（纯白背景 #FFFFFF），无水印、无文字、无 logo。</li>
            <li><strong>文件大小</strong>：单张不超过 3MB。</li>
            <li><strong>格式</strong>：JPG 或 PNG。</li>
          </ul>
          <p>
            淘宝白底图是最严格的——背景必须是纯白色，不能有任何阴影或渐变。使用抠图工具去掉背景后，放在白色画布上即可。
          </p>

          <h2>二、京东</h2>
          <p>
            京东对主图的要求和淘宝类似，但有一些细节差异：
          </p>
          <ul>
            <li><strong>主图尺寸</strong>：建议 800×800 像素，最低 500×500。</li>
            <li><strong>图片比例</strong>：1:1 正方形。</li>
            <li><strong>主图数量</strong>：最多 6 张。</li>
            <li><strong>白底图要求</strong>：第 1 张主图必须为白底图，背景纯白，商品居中。</li>
            <li><strong>文件大小</strong>：单张不超过 1MB。</li>
            <li><strong>格式</strong>：JPG 或 PNG。</li>
          </ul>
          <p>
            京东对文件大小限制更严格（1MB），如果图片太大需要压缩。
          </p>

          <h2>三、拼多多</h2>
          <p>
            拼多的主图规范相对宽松一些：
          </p>
          <ul>
            <li><strong>主图尺寸</strong>：建议 750×352 像素（横图）或 750×750 像素（方图）。</li>
            <li><strong>图片比例</strong>：支持 1:1 和其他比例。</li>
            <li><strong>主图数量</strong>：最多 10 张。</li>
            <li><strong>白底图要求</strong>：不强制要求白底，但白底图在搜索结果中展示效果更好。</li>
            <li><strong>文件大小</strong>：单张不超过 1MB。</li>
            <li><strong>格式</strong>：JPG 或 PNG。</li>
          </ul>
          <p>
            虽然拼多多不强制白底图，但建议还是准备一张白底主图，因为白底图在各平台搜索结果中点击率通常更高。
          </p>

          <h2>四、亚马逊（Amazon）</h2>
          <p>
            亚马逊对主图的要求是所有平台中最严格的：
          </p>
          <ul>
            <li><strong>主图尺寸</strong>：建议 1600×1600 像素以上（支持缩放），最低 1000×1000。</li>
            <li><strong>图片比例</strong>：1:1 正方形。</li>
            <li><strong>主图数量</strong>：最多 9 张（1 张主图 + 8 张副图）。</li>
            <li><strong>白底图要求</strong>：主图必须是纯白背景（RGB 255, 255, 255），商品占画面 85% 以上，无水印、无文字、无道具。</li>
            <li><strong>文件大小</strong>：单张不超过 10MB。</li>
            <li><strong>格式</strong>：JPG、TIFF、PNG。</li>
          </ul>
          <p>
            亚马逊的白底要求非常严格——商品必须占据画面 85% 以上，且背景必须纯白。这对抠图精度要求很高。
          </p>

          <h2>五、抖音电商</h2>
          <p>
            抖音电商的主图规范：
          </p>
          <ul>
            <li><strong>主图尺寸</strong>：建议 600×600 像素以上。</li>
            <li><strong>图片比例</strong>：1:1 正方形。</li>
            <li><strong>主图数量</strong>：最多 5 张。</li>
            <li><strong>白底图要求</strong>：不强制，但建议第 1 张使用清晰的产品图。</li>
            <li><strong>文件大小</strong>：单张不超过 5MB。</li>
            <li><strong>格式</strong>：JPG 或 PNG。</li>
          </ul>

          <h2>通用建议</h2>
          <p>
            不管你在哪个平台开店，以下几点都适用：
          </p>
          <ul>
            <li><strong>准备多版本图片</strong>：白底主图 + 透明 PNG + 场景图，适配不同平台需求。</li>
            <li><strong>统一拍摄标准</strong>：一批商品图用相同的拍摄角度和光线，保持店铺视觉统一。</li>
            <li><strong>先拍高分辨率</strong>：拍高清原图，再根据各平台要求缩放。低分辨率放大无法补救。</li>
            <li><strong>用抠图工具批量处理</strong>：白橙铺支持批量抠图，一次处理多张商品图，快速生成透明 PNG 和白底图。</li>
          </ul>

          <h2>总结</h2>
          <p>
            各平台主图规范虽然细节不同，但核心原则一致：清晰、干净、商品突出。只要准备好高质量的商品原图，配合 AI 抠图工具，就能快速生成符合各平台要求的图片素材。
          </p>
          <p>
            如果你需要批量制作白底图或透明 PNG，试试白橙铺的免费抠图工具。
          </p>
        </div>

        <section className="article-cta">
          <h3>需要批量制作商品图？</h3>
          <p>白橙铺支持单张和批量抠图，本地处理，免费导出透明 PNG。</p>
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
