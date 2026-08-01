import type { Metadata } from "next";
import { AccountMenu } from "../../AccountMenu";
import { getAccountUser } from "../../account-auth";

export const metadata: Metadata = {
  title: "电商商品图拍摄技巧：让抠图更干净的 6 个要点｜白橙铺",
  description:
    "好的商品图是抠图效果的基础。本文从光线、背景、角度、构图等方面，教你拍出更容易处理的商品照片。",
};

export const dynamic = "force-dynamic";

export default async function ProductPhotoTipsPage() {
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
          <span className="eyebrow">拍摄技巧</span>
          <h1>电商商品图拍摄技巧：让抠图更干净的 6 个要点</h1>
          <p>发布日期：2026 年 7 月 31 日</p>
        </section>

        <div className="article-body">
          <p>
            做电商的卖家都知道，商品主图的质量直接影响点击率和转化率。而一张干净的主图，往往需要先拍好照片，再把背景去掉。很多人把希望全部寄托在抠图工具上，但其实如果拍摄阶段就注意几个关键点，后期的抠图效果会好很多，甚至可以省去大量修图时间。
          </p>

          <p>
            本文从实际操作出发，总结 6 个让商品图更容易抠干净的拍摄要点。无论你用手机还是相机，都可以用上。
          </p>

          <h2>1. 选择纯色背景</h2>
          <p>
            抠图工具的核心原理是区分前景（商品）和背景。背景越简单、颜色越单一，工具就越容易把两者分开。最推荐的做法是在纯白背景上拍摄——可以用白纸、白色亚克力板或小型摄影棚。
          </p>
          <p>
            如果条件有限，浅灰色背景也可以。尽量避免花哨的桌面、有图案的布料或杂乱的环境，这些会让抠图算法难以判断边界。
          </p>

          <h2>2. 保证充足且均匀的光线</h2>
          <p>
            光线是拍摄中最重要的因素。光线不足会导致照片噪点多、边缘模糊，抠图时容易出现毛边。光线不均匀则会在商品周围产生阴影或反光，这些阴影会被算法误认为是商品的一部分。
          </p>
          <p>
            建议使用以下打光方式：
          </p>
          <ul>
            <li><strong>自然光</strong>：在白天靠窗拍摄，利用柔和的散射光。</li>
            <li><strong>柔光箱</strong>：如果经常拍商品图，入一个小型柔光箱，光线均匀且可控。</li>
            <li><strong>双灯布光</strong>：左右各一个灯，45 度角打向商品，消除单侧阴影。</li>
          </ul>

          <h2>3. 拍摄角度保持正面或微俯</h2>
          <p>
            电商主图的标准角度是正面平视或略微俯拍。这个角度能展示商品的真实比例和外观，也最符合买家的浏览习惯。从侧面或仰拍虽然可能有创意效果，但对于主图来说不太合适，而且侧面的边缘往往更复杂，增加抠图难度。
          </p>
          <p>
            如果商品有立体造型（如鞋包、玩具），可以多拍几张不同角度的图作为细节图，但主图建议保持正面。
          </p>

          <h2>4. 商品占画面比例足够大</h2>
          <p>
            拍摄时让商品占据画面的大部分空间，四周留少量边距即可。这样做有两个好处：一是照片分辨率利用率高，商品细节更清晰；二是抠图后的透明 PNG 不会因为四周空白太多而需要二次裁剪。
          </p>
          <p>
            一般建议商品占画面宽度的 60% 到 80%。
          </p>

          <h2>5. 避免透明或反光材质的特殊处理</h2>
          <p>
            如果你的商品本身是透明材质（如玻璃器皿、塑料包装）或高反光材质（如金属、镜面），抠图难度会大幅增加。这类商品的边界本身就模糊，算法很难判断哪里是商品、哪里是背景。
          </p>
          <p>
            对于这类商品，建议：
          </p>
          <ul>
            <li>在商品后面放一块与商品颜色对比明显的背景板。</li>
            <li>使用偏振镜减少反光（相机拍摄时）。</li>
            <li>适当增加曝光，让商品轮廓更清晰。</li>
            <li>抠图后用手动修边工具微调边缘。</li>
          </ul>

          <h2>6. 拍摄分辨率不要太低</h2>
          <p>
            电商主图通常需要 800×800 像素以上，有些平台要求 1200×1200 甚至更高。如果拍摄分辨率太低，抠图后放大会模糊，影响主图质量。建议拍摄时使用较高的分辨率，后期再根据平台要求缩放。
          </p>
          <p>
            手机拍摄时注意检查相机设置，确保输出的是最高分辨率。如果用相机，建议用 RAW 格式拍摄，后期处理空间更大。
          </p>

          <h2>总结</h2>
          <p>
            好的拍摄是抠图成功的一半。只要做到纯色背景、均匀光线、正面角度、合适比例、注意特殊材质、足够分辨率这六点，配合白橙铺的 AI 抠图工具，你就可以轻松获得干净透明的商品 PNG 图片。
          </p>
          <p>
            如果你已经拍好了商品图，现在就可以试试上传到白橙铺，体验一键自动抠图。
          </p>
        </div>

        <section className="article-cta">
          <h3>准备好商品图了？</h3>
          <p>上传到白橙铺，AI 自动移除背景，本地处理，免费下载透明 PNG。</p>
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
