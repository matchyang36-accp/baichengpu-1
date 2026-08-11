/**
 * Recovered from Cloudflare production version
 * 6a48a349-827b-4b6f-81f8-c512da601e16.
 *
 * Data only: keep routing, React and server APIs out of this module so it can
 * be shared by server and client translators.
 */
export const messageRecords = {
	en: {
		common: {
			"brand": {
				"name": "edit-photo",
				"mark": "B",
				"tagline": "Local AI · Free"
			},
			"nav": {
				"label": "Main navigation",
				"home": "Home",
				"howItWorks": "How it works",
				"batch": "Batch",
				"pricing": "Pro",
				"contact": "Contact",
				"blog": "Guides",
				"privacy": "Privacy",
				"singleCutout": "Single Cutout",
				"batchVersion": "Batch",
				"proVersion": "Pro Plan"
			},
			"footer": {
				"copyright": "© 2026 edit-photo",
				"guides": "Guides",
				"pricing": "Pro Plan",
				"privacy": "Privacy",
				"contact": "Contact",
				"disclaimer": "Disclaimer",
				"clearCache": "Clear model cache",
				"cacheCleared": "Cache cleared"
			},
			"language": {
				"switch": "Language",
				"english": "English",
				"chinese": "中文"
			},
			"trust": { "label": "Features" }
		},
		home: {
			"hero": {
				"eyebrow": "AI Product Background Removal",
				"title": "Product photos, cleanly cut out in",
				"titleHighlight": "one click",
				"description": "Upload an image, AI removes the background automatically. Processed locally in your browser — no sign-up, download transparent PNG instantly.",
				"trustBrowser": "✓ Processed in browser",
				"trustFullSize": "✓ Full-resolution export",
				"trustNoSignup": "✓ No sign-up needed"
			},
			"workbench": {
				"kicker": "Online tool / Single cutout",
				"title": "Upload a product image",
				"privacyNote": "● Image stays on your device",
				"uploadButton": "Select product image",
				"dropzoneTitle": "Drop a product image here",
				"dropzoneHint": "Or click to select, paste a screenshot",
				"dropzoneHintSize": "Supports JPG / PNG / WebP · Max 12MB",
				"errorFormat": "Please select a JPG, PNG, or WebP image",
				"errorSize": "Image exceeds 12MB, please compress and try again"
			},
			"processing": {
				"loadingModel": "Loading local AI model",
				"cleaningEdges": "AI is cleaning edges and background artifacts",
				"firstTimeHint": "First-time initialization may take 1–2 minutes. Please keep this page open.",
				"keepOpenHint": "Please keep this page open. Your image stays on your device.",
				"waiting": "Elapsed",
				"seconds": "{n}s",
				"minutesSeconds": "{m}m {s}s",
				"original": "Original",
				"transparent": "Transparent",
				"resultBadge": "Transparent BG",
				"compareLabel": "Original vs transparent position {position}%",
				"timeoutError": "Local AI startup exceeded 2 minutes. Your browser may be stuck. Please refresh and try again.",
				"memoryError": "Insufficient device memory. Please close other tabs, or try a smaller image.",
				"genericError": "Local model failed to load. Diagnostic version: {version}; code: {code}. Please retry.",
				"scanOriginal": "Original",
				"scanTransparent": "Transparent BG"
			},
			"result": {
				"downloadPng": "Download PNG",
				"zoomHint": "View details",
				"zoomHintDrag": "Drag to view details",
				"zoomOut": "− Zoom out",
				"zoomIn": "+ Zoom in",
				"zoomReset": "Reset zoom {zoom}%",
				"panMode": "Drag image",
				"panning": "Panning",
				"viewSide": "Side by side",
				"viewCompare": "Slide compare",
				"cleanup": "Edge cleanup",
				"cleanupStandard": "Standard",
				"cleanupStrong": "Strong",
				"cleanupShadow": "Shadow",
				"cleanupProcessing": "Re-cleaning…",
				"cleanupStandardHint": "Best for most product images",
				"cleanupStrongHint": "Best for complex textures and floor artifacts",
				"cleanupShadowHint": "Best for products that need natural grounding",
				"manualEdit": {
					"title": "Still have edge artifacts or gaps?",
					"description": "Use erase and restore brushes for final touch-ups. Undo supported.",
					"button": "Manual touch-up"
				}
			},
			"product": {
				"kicker": "02 / Product image",
				"title": "Generate platform-ready white background image",
				"platformLabel": "Select platform",
				"previewLabel": "White background preview",
				"bgColor": "Background color",
				"productSize": "Product size",
				"horizontal": "Horizontal position",
				"vertical": "Vertical position",
				"addShadow": "Add natural shadow",
				"downloadTransparent": "Download transparent PNG",
				"downloadProduct": "Download product image",
				"exporting": "Generating…",
				"processAnother": "Process another"
			},
			"feedback": {
				"title": "Was this cutout ready to use?",
				"privacy": "Feedback does not include your image",
				"satisfied": "Satisfied",
				"unsatisfied": "Not satisfied",
				"thanks": "Thanks for the feedback. We'll use it to improve.",
				"issues": {
					"artifacts": "Artifacts",
					"missingEdges": "Missing edges",
					"shadowError": "Shadow error",
					"transparentObject": "Transparent object",
					"subjectError": "Subject detection error"
				},
				"submit": "Submit issue"
			},
			"error": {
				"title": "Processing failed this time",
				"retry": "Retry processing",
				"reload": "Refresh page to retry",
				"chooseAnother": "Select another"
			},
			"stats": {
				"stepsLabel": "3 steps",
				"stepsDesc": "Upload → Auto cutout → Download",
				"uploadLabel": "0 uploads",
				"uploadDesc": "Processing happens locally only",
				"imageLabel": "1+ images",
				"imageDesc": "Start free with real product images"
			},
			"nextSteps": {
				"eyebrow": "What's next",
				"title": "Not another tool — less repetitive work.",
				"batchBadge": "Available now",
				"batchTitle": "Batch product images",
				"batchDesc": "Select multiple product images, auto-queue cutout, download transparent PNGs as a batch."
			}
		},
		batch: {
			"title": "Batch Cutout",
			"description": "Process multiple product images in your browser, auto-queue, and download transparent PNGs in a batch.",
			"hero": {
				"eyebrow": "02 / Batch Workbench",
				"titleLine1": "Multiple product images,",
				"titleLine2": "auto-queue, process once.",
				"subtitle": "Select up to {max} images. AI processes them one by one in your browser — images never upload."
			},
			"stats": {
				"label": "Batch task status",
				"selectedLabel": "selected",
				"completedLabel": "completed",
				"pendingLabel": "pending"
			},
			"dropzone": {
				"title": "Drop multiple product images here",
				"hint": "Supports JPG / PNG / WebP · Max 12MB each",
				"button": "Select multiple images"
			},
			"progress": {
				"batchProgress": "Batch progress",
				"estimatedRemaining": "Est. remaining",
				"processingMode": "Processing mode",
				"multiThread": "Multi-thread",
				"stableMode": "Stable mode",
				"processing": "Processing {completed}/{total}",
				"starting": "Start processing {n} images"
			},
			"items": {
				"queued": "Waiting",
				"processing": "Processing {progress}%",
				"done": "Done · {duration}",
				"error": "Processing failed, can retry",
				"preview": "Preview",
				"download": "Download",
				"retry": "Retry",
				"remove": "Remove",
				"resultAlt": "cutout result",
				"sourceAlt": "original"
			},
			"preview": {
				"title": "Batch result preview",
				"close": "Close preview",
				"original": "Original",
				"transparent": "Transparent",
				"sourceAlt": "Batch product original",
				"resultAlt": "Batch cutout result",
				"manualEdit": "Manual touch-up",
				"downloadPng": "Download transparent PNG"
			},
			"actions": {
				"processAll": "Process all",
				"downloadAll": "Download all",
				"downloadAllCount": "Pack and download {count} images",
				"packaging": "Packing…",
				"clear": "Clear tasks"
			},
			"nav": {
				"label": "Batch navigation",
				"single": "Single cutout",
				"pro": "Pro",
				"contact": "Contact",
				"pill": "Batch beta"
			},
			"notices": {
				"maxBatch": "Free tier max {max} images. Please process or clear current tasks first.",
				"added": "{added} images added.",
				"addedSkipped": "{added} added, {skipped} skipped due to format, size, or limit.",
				"modelLoading": "Preparing local AI model — using stable single-task mode.",
				"modelFail": "Local model failed to load. Check your network and try again.",
				"done": "Batch complete. Preview, touch up, or pack and download.",
				"doneWithFailures": "Batch complete — {failed} failed. Retry individually.",
				"zipFail": "Could not create the download pack. Download images individually or try again."
			},
			"download": {
				"zipName": "edit-photo-batch-{count}-images.zip",
				"transparentSuffix": "-transparent.png",
				"defaultName": "product",
				"gridLabel": "Batch image tasks"
			},
			"duration": {
				"estimating": "Estimating",
				"completed": "Completed",
				"approx": "~",
				"seconds": "sec",
				"minutes": "min"
			},
			"brand": { "homeLabel": "Back to edit-photo home" }
		},
		pricing: {
			"title": "Pricing",
			"description": "edit-photo free and pro plans for product image background removal.",
			"eyebrow": "Plans & Pricing",
			"title_main": "Simple, transparent pricing",
			"free": {
				"name": "Free",
				"price": "¥0",
				"period": "/month",
				"features": [
					"Single & batch cutout",
					"Transparent PNG & white background",
					"Manual touch-up & edge cleanup",
					"Up to 5 images per batch"
				],
				"cta": "Start free"
			},
			"pro": {
				"name": "Pro",
				"price": "¥39",
				"period": "/month",
				"badge": "Beta",
				"features": [
					"500 cutouts/month",
					"Batch up to 50 images",
					"Strong & shadow cleanup modes",
					"Manual touch-up",
					"All platform presets"
				],
				"cta": "Get Pro"
			},
			"team": {
				"name": "Team",
				"price": "¥199",
				"period": "/month",
				"features": [
					"3000 cutouts/month",
					"Batch up to 200 images",
					"5-20 team members",
					"API access",
					"Custom presets"
				],
				"cta": "Contact sales"
			},
			"faq": {
				"title": "Frequently asked questions",
				"q1": "Is the free version really free?",
				"a1": "Yes. Single and batch cutout are free forever. No credit card required.",
				"q2": "Can I use my cutouts commercially?",
				"a2": "Yes. All output images are yours to use for any purpose.",
				"q3": "How does billing work?",
				"a3": "Monthly subscription via Stripe. Cancel anytime. Credits reset each billing cycle."
			},
			"form": {
				"eyebrow": "Pro Beta Application",
				"title": "Tell us in 1 minute what you repeat every day.",
				"description": "We'll prioritize users whose needs match. After submitting, you can add WeChat to discuss real image scenarios.",
				"promiseTitle": "We only collect what's necessary",
				"promiseDesc": "No image uploads, no marketing texts, no auto-charges.",
				"successTitle": "Application received",
				"successDesc": "Next, please add our WeChat and note \"Pro Beta\" — we'll arrange a trial based on your use case.",
				"successLink": "View WeChat QR code",
				"roleLabel": "Your role",
				"selectPlaceholder": "Please select",
				"roleOptions": [
					"E-commerce operator / Owner",
					"New media editor",
					"Photography / Design",
					"Team lead",
					"Other"
				],
				"volumeLabel": "Approx. images per month",
				"volumeOptions": [
					"1–20",
					"21–100",
					"101–500",
					"500+"
				],
				"needsLabel": "Top problems to solve (multi-select)",
				"needOptions": [
					"Complex background cutout",
					"Batch processing speed",
					"Platform template presets",
					"Image size unification",
					"Brand background replacement",
					"Team collaboration"
				],
				"contactLabel": "Contact method",
				"channelWechat": "WeChat ID",
				"channelEmail": "Email",
				"contactInputPlaceholder": "WeChat ID or email",
				"contactInputHint": "For beta invitation",
				"noteLabel": "Other needs (optional)",
				"notePlaceholder": "e.g., mainly clothing photos, want to preserve natural shadows",
				"consentText": "I have read and agree to the",
				"privacyLink": "Privacy Policy",
				"honeypotLabel": "Website",
				"submitButton": "Submit application",
				"submitting": "Submitting…",
				"errorMessage": "Submission failed. Please try again later, or add our WeChat via the contact page."
			}
		},
		auth: {
			"title": "Sign in",
			"description": "Register or sign in to your edit-photo account.",
			"login": {
				"eyebrow": "Welcome back",
				"title": "Sign in",
				"description": "Continue using your account and plan benefits. Your images are still never uploaded.",
				"submit": "Sign in",
				"switchLabel": "Don't have an account?",
				"switchAction": "Sign up free"
			},
			"register": {
				"eyebrow": "Create account",
				"title": "Secure your plan benefits",
				"description": "Registration is only used to identify your account and carry plan benefits. Your product images always stay in your browser.",
				"submit": "Sign up free",
				"switchLabel": "Already have an account?",
				"switchAction": "Log in"
			},
			"form": {
				"displayName": "Display name",
				"displayNamePlaceholder": "e.g., Store Owner",
				"email": "Email",
				"emailPlaceholder": "name@example.com",
				"password": "Password",
				"passwordPlaceholder": "At least 10 characters, include numbers and symbols",
				"confirmPassword": "Confirm password",
				"confirmPasswordPlaceholder": "Re-enter your password",
			"submitting": "Please wait…",
			"forgotPassword": "Forgot password?",
				"passwordMismatch": "Passwords do not match.",
				"networkError": "Network temporarily unavailable. Please try again.",
				"termsPrefix": "By signing up or logging in, you agree to our",
				"privacyLink": "Privacy Policy"
			},
			"trust": {
				"eyebrow": "Privacy & security",
				"title": "Sign-in doesn't change local processing",
				"points": [
					"Originals and results never uploaded",
					"Passwords are salted and PBKDF2-derived",
					"Session cookie is HttpOnly — scripts can't read it"
				]
			},
			"backToTool": "Back to cutout tool",
			"errors": {
				"INVALID_CREDENTIALS": "Incorrect email or password.",
				"RATE_LIMITED": "Too many attempts. Please try again later.",
				"EMAIL_EXISTS": "This email is already registered. Please log in instead.",
				"WEAK_PASSWORD": "Password must be at least 10 characters with both letters and numbers.",
				"INVALID_INPUT": "Please check that your name, email, and password are correct.",
				"ACCOUNT_DISABLED": "This account is temporarily unavailable. Please contact us.",
				"STORE_FAILED": "Server error. Please try again.",
				"default": "The operation didn't complete. Please try again.",
				"network": "Network temporarily unavailable. Please try again."
			}
		},
		account: {
			"title": "My Account",
			"description": "Manage your edit-photo account and plan.",
			"eyebrow": "My account",
			"greeting": "Hello, {name}",
			"description_main": "Your account holds your identity and plan. Product images are still processed locally in your browser.",
			"profile": {
				"label": "Current account",
				"synced": "✓ Account signed in securely"
			},
			"plan": {
				"label": "Current plan",
				"free": "Free plan",
				"description": "Single & batch cutout run locally. No uploads.",
				"features": [
					"Transparent PNG & white background",
					"Manual touch-up & edge cleanup",
					"Up to 5 images per batch"
				],
				"viewPro": "View Pro plan",
				"quotaLabel": "Monthly quota",
				"perMonth": "/month",
				"batchLabel": "Batch limit",
				"images": "images"
			},
			"privacy": {
				"label": "Privacy promise",
				"title": "Sign-in doesn't change local processing",
				"description": "Login identifies your account for future benefits. It never uploads your original images or cutout results to our servers.",
				"viewPrivacy": "View privacy policy"
			},
			"actions": {
				"startCutout": "Start cutout",
				"logout": "Sign out",
				"loggingOut": "Signing out…"
			},
			"loading": "Loading account…"
		},
		contact: {
			"title": "Contact",
			"description": "Contact edit-photo via email or WeChat.",
			"eyebrow": "Contact & partnership",
			"title_main": "Get in touch",
			"description_main": "For batch processing, business partnerships, or product feedback, email us.",
			"emailLabel": "Email",
			"email": "matchyang36@gmail.com",
			"wechatNote": "Please note \"edit-photo\" when adding on WeChat.",
			"wechatQr": "Scan QR to add on WeChat",
			"qrAlt": "edit-photo WeChat contact QR code",
			"backButton": "Back to cutout tool"
		},
		privacy: {
			"title": "Privacy",
			"description": "How edit-photo processes images locally and protects user privacy.",
			"eyebrow": "Privacy & data",
			"title_main": "Your product images stay on your device.",
			"lead": "edit-photo uses a browser-local AI model for background removal. Your selected original images and cutout results are never uploaded to our servers.",
			"sections": {
				"processing": {
					"title": "Image processing",
					"body": "Single and batch cutout both run in your browser. After closing or refreshing the page, temporary previews and results may be cleared — please download files you want to keep."
				},
				"model": {
					"title": "Model files & browser cache",
					"body": "On first use, the browser downloads approximately 66MB of local AI model and runtime components. The site uses versioned browser cache to speed up subsequent visits, and clears old versions on model updates. Your product images are never stored in the cache. You can manually clear the model cache in the page footer."
				},
				"feedback": {
					"title": "Quality feedback",
					"body": "If you submit a satisfaction rating or issue category, the system only records the selected feedback, processing mode, and basic diagnostic info — never your original or cutout images."
				},
				"auth": {
					"title": "Registration & sign-in",
					"body": "edit-photo only stores your account email, display name, salted and PBKDF2-derived password credentials, plan status, and necessary login timestamps. Sessions use secure HttpOnly cookies. We never store your plaintext password."
				},
				"analytics": {
					"title": "Usage analytics",
					"body1": "To understand usage and improve the product, we use a first-party anonymous visitor ID to record visit time, pages viewed, referral source, device type, and approximate country/region/city location provided by Cloudflare. After sign-in, the anonymous ID may be linked to your account for tracking key actions like cutout and download.",
					"body2": "Analytics never stores your raw IP address, original images, or cutout results. When Global Privacy Control (GPC) or Do Not Track (DNT) signals are detected, no analytics records are written."
				},
				"proInterest": {
					"title": "Pro plan application",
					"body": "When you apply for the Pro beta, we store your role, image volume, needs, contact info, and notes — used for screening beta users and follow-up. You can contact us to correct or delete this data."
				},
				"contactUs": {
					"title": "Contacting us",
					"body": "When you contact us via email, the information is handled by the respective communication platform. Please do not send sensitive images or materials you don't want us to see."
				},
				"updates": {
					"title": "Policy updates",
					"body": "If we add cloud storage or payment features in the future, we will update this policy before launch and clearly explain data usage and retention."
				},
				"cookies": {
					"title": "Cookies & third-party ads",
					"body1": "This site uses cookies and similar technologies to improve user experience, analyze traffic, and display ads. Third-party ad providers like Google AdSense may use cookies to show ads based on your past visits.",
					"body2": "Google uses cookies to store ad preferences and frequency. You can manage or delete cookies in your browser settings, or visit Google Ad Settings to personalize or disable personalized ads.",
					"body3": "Third-party ad vendors (including Google) are subject to applicable regulations. See Google's privacy policy for partner sites."
				}
			},
			"actions": {
				"backToTool": "Back to free cutout",
				"askPrivacy": "Ask about privacy"
			},
			"links": {
				"adSettings": "Google Ad Settings",
				"partnerPolicy": "Google policy for partner sites"
			},
			"updated": "Last updated: August 1, 2026"
		},
		disclaimer: {
			"title": "Disclaimer",
			"description": "Disclaimer covering the use of edit-photo and its output.",
			"eyebrow": "Disclaimer",
			"title_main": "AI cutout results are for reference — verify before use.",
			"lead": "edit-photo removes image backgrounds using a browser-local AI model. The following explains the limits and responsibilities of using this tool. By using this site you acknowledge and agree to these terms.",
			"sections": {
				"resultAccuracy": {
					"title": "No guarantee of results",
					"body": "Cutout quality depends on source image quality, subject complexity, and edge cases. For hair, semi-transparent objects, fine cutouts, low-contrast or blurry images, results may be incomplete or contain artifacts. We do not guarantee 100% accurate cutouts."
				},
				"userRisk": {
					"title": "Use at your own risk",
					"body": "You are responsible for checking that the cutout meets your needs and confirming its suitability before use. Any loss or consequence arising from using or relying on this tool's output is borne by you."
				},
				"prohibitedUse": {
					"title": "Prohibited uses",
					"body": "This tool is not intended for authoritative processing of sensitive identity, legal, medical, or financial documents, nor for any unlawful or rights-infringing use. Ensure your use complies with applicable laws and regulations."
				},
				"asIs": {
					"title": "Provided \"as is\"",
					"body": "The service is provided \"as is\" without warranty of uninterrupted availability, error-free operation, or absence of viruses. We may modify, suspend, or discontinue features at any time without individual notice."
				},
				"copyright": {
					"title": "Content & copyright",
					"body": "You must own the legal rights or have sufficient authorization for images you upload. You bear responsibility for uploading or using infringing or unlawful content. edit-photo is not liable for user content."
				}
			},
			"actions": {
				"backToTool": "Back to free cutout",
				"askContact": "Contact us"
			},
			"updated": "Last updated: August 5, 2026"
		},
		tool: {
			"hero": {
				"eyebrow": "Free Online AI Background Remover",
				"titlePrefix": "AI Background Remover for ",
				"titleHighlight": "Product Photos",
				"descPrefix": "Upload an image, AI automatically removes the background. ",
				"descHighlight": "local processing",
				"descSuffix": ", no registration, download transparent PNG."
			},
			"trust": {
				"local": "✓ Browser-side processing",
				"originalSize": "✓ Original-size export",
				"noReg": "✓ No registration"
			},
			"nav": {
				"home": "Home",
				"howItWorks": "How to use",
				"batch": "Batch",
				"pro": "Pro",
				"contact": "Contact",
				"pill": "Local AI · Free"
			},
			"upload": {
				"stepKicker": "Online tool / Single cutout",
				"title": "Upload product image",
				"privacyNote": "Image never leaves your device",
				"dropTitle": "Drop a product image here",
				"dropHint": "or click to select, paste a screenshot",
				"select": "Select product image",
				"formatHint": "Supports JPG / PNG / WebP · Max 12MB",
				"selectLabel": "Select product image",
				"originalAlt": "Original product image awaiting processing"
			},
			"status": {
				"preparing": "Preparing image",
			"loadingModel": "Loading local AI model",
			"cleaning": "AI is refining edges and background noise",
			"modelDownloaded": "Model downloaded. Starting local AI",
			"modelDownloading": "First use: downloading the AI model (about 66MB)",
			"runtimePreparing": "Preparing local runtime components",
			"decoding": "Reading and resizing the product image",
			"inference": "AI is detecting the product and its edges",
			"masking": "Generating transparent edges",
			"encoding": "Generating transparent PNG",
			"modelPreparing": "Preparing the local AI model",
				"firstInitHint": "First-time initialization may take 1–2 minutes. Keep this page open.",
				"processingHint": "Keep this page open — your image stays on your device.",
				"elapsed": "Waited",
				"seconds": "sec",
				"minutes": "min",
				"secondsUnit": "sec"
			},
			"result": {
				"original": "Original",
				"transparent": "Transparent",
				"downloadPng": "Download PNG",
				"originalAlt": "Original product image",
				"removedBgAlt": "Product image with background removed",
				"transparentAlt": "Transparent background result",
				"compareAlt": "Original product image for comparison",
				"compareSliderLabel": "Compare slider position at {position}%"
			},
			"view": {
				"sideBySide": "Side by side",
				"compare": "Slide compare",
				"drag": "Drag view",
				"dragging": "Dragging",
				"zoomHint": "View details",
				"zoomDragHint": "Drag to view details",
				"zoomIn": "+ Zoom in",
				"zoomOut": "− Zoom out",
				"zoomControlsLabel": "Image zoom controls",
				"viewModeLabel": "View mode",
				"currentZoom": "Current zoom {zoom}%, click to reset"
			},
			"cleanup": {
				"label": "Edge refinement",
				"standard": "Standard",
				"strong": "Strong cleanup",
				"shadow": "Keep shadow",
				"reprocessing": "Refining…",
				"standardHint": "Good for most product images",
				"strongHint": "For complex textures and floor noise",
				"shadowHint": "For products needing a natural grounded look",
				"manualHint": "Still seeing edge noise or gaps?",
				"manualDesc": "Use erase and restore brushes for final touch-ups, supports undo.",
				"manualButton": "Manual touch-up",
				"controlsLabel": "Cutout refinement intensity"
			},
			"product": {
				"stepKicker": "02 / E-commerce main image",
				"title": "One-click platform white-background image",
				"bgColor": "Background color",
				"size": "Product size",
				"posX": "Horizontal position",
				"posY": "Vertical position",
				"shadow": "Add natural shadow",
				"downloadTransparent": "Download transparent PNG",
				"downloadWhite": "Download white-background image",
				"generating": "Generating…",
				"again": "Process another",
				"composerLabel": "E-commerce white-background main image",
				"previewLabel": "White-background preview",
				"previewAlt": "Product main image preview",
				"platformLabel": "Select platform",
				"customColorLabel": "Custom background color",
				"selectColorLabel": "Select background color {color}"
			},
			"platforms": {
			"amazon": "Amazon main image",
			"amazonShort": "Amazon",
			"taobao": "Taobao main image",
			"taobaoShort": "Taobao",
			"pinduoduo": "Pinduoduo main image",
			"pinduoduoShort": "Pinduoduo",
			"douyin": "Douyin Shop main image",
			"douyinShort": "Douyin Shop",
			"shopify": "Shopify main image",
				"shopifyShort": "Shopify",
				"ebay": "eBay main image",
				"ebayShort": "eBay"
			},
			"feedback": {
				"label": "Cutout quality feedback",
				"thanks": "Thanks for your feedback — we'll use it to improve product image results.",
				"title": "Is this cutout usable as-is?",
				"hint": "Feedback does not include your image",
				"satisfied": "Satisfied",
				"unsatisfied": "Not satisfied",
				"submit": "Submit issue",
				"issues": [
					"Noise",
					"Edge gaps",
					"Shadow error",
					"Transparent object",
					"Subject detection error"
				]
			},
			"error": {
				"title": "Processing failed",
				"select": "Select another",
				"retry": "Retry",
				"reload": "Reload page",
				"invalidType": "Please select a JPG, PNG, or WebP image",
				"tooLarge": "Image exceeds 12MB. Please compress and try again.",
				"timeout": "Local AI startup exceeded 2 minutes. The browser environment may be stuck. Please reload the page and try again.",
				"outOfMemory": "Device memory insufficient. Close other tabs or use a smaller image.",
				"modelNotReady": "Local model not fully loaded. Diagnostic version: {version}; Code: {code}. Tap retry."
			},
			"steps": {
				"label": "How it works",
				"step1Title": "3 steps",
				"step1Desc": "Upload → Auto cutout → Download",
				"step2Title": "0 uploads",
				"step2Desc": "Processing happens locally only",
				"step3Title": "From 1 image",
				"step3Desc": "Try it free on real product images"
			},
			"cta": {
				"eyebrow": "What's next",
				"title": "Not another tool — one less repetitive task.",
				"batchBadge": "Beta available",
				"batchTitle": "Batch white-background images",
				"batchDesc": "Select multiple product images at once, auto-queue cutout, download as a transparent PNG pack.",
				"batchLink": "Try batch processing →"
			},
			"footer": {
				"copyright": "© 2026 edit-photo",
				"guide": "Guides",
				"pricing": "Pro plan",
				"privacy": "Privacy",
				"contact": "Contact",
				"disclaimer": "Disclaimer",
				"clearCache": "Clear model cache",
				"cacheCleared": "Cache cleared"
			},
			"download": {
				"transparentSuffix": "-transparent.png",
				"whiteSuffix": "-white-bg.png",
				"defaultName": "product"
			},
			"brand": {
				"name": "edit-photo",
				"homeLabel": "edit-photo home"
			}
		},
		maskEditor: {
			"stepKicker": "Edge refinement",
			"title": "Erase noise, restore missing edges",
			"close": "Close manual editor",
			"canvasLabel": "Manual refinement canvas",
			"hdFail": "HD canvas failed. Close and retry.",
			"hdPreparing": "Preparing HD canvas…",
			"toolsLabel": "Refinement tools",
			"erase": "Erase noise",
			"restore": "Restore edges",
			"brush": "Brush",
			"zoomLabel": "Canvas zoom",
			"zoomIn": "Zoom in",
			"zoomOut": "Zoom out",
			"zoomReset": "Reset zoom",
			"panHint": "Hold Alt to drag the image",
			"undoTitle": "Undo step by step back to original state",
			"undo": "Undo",
			"resetTitle": "Discard all manual edits and restore the original state",
			"resetAll": "Restore all",
			"cancel": "Cancel",
			"apply": "Apply edits",
			"saving": "Saving…"
		},
		admin: { "login": {
			"eyebrow": "Admin only",
			"title": "Admin sign-in",
			"description": "Verify admin identity to view registered users and manage account status and plans.",
			"email": "Admin account",
			"password": "Admin password",
			"passwordPlaceholder": "Enter admin password",
			"submit": "Sign in to admin",
			"submitting": "Verifying…",
			"terms": "This entrance is for authorized admins only. Repeated failures trigger temporary lockout.",
			"errors": {
				"INVALID_CREDENTIALS": "Admin password is incorrect.",
				"RATE_LIMITED": "Too many attempts. Please try later.",
				"ACCOUNT_DISABLED": "Admin account is disabled.",
				"default": "Sign-in failed. Please try again.",
				"network": "Network unavailable. Please try again."
			}
		} },
		blog: /* @__PURE__ */ JSON.parse("{\"title\":\"Guides & Knowledge\",\"description\":\"Product photo tips, transparent PNG knowledge, and e-commerce platform image specs — practical guides from edit-photo.\",\"eyebrow\":\"Guides\",\"title_main\":\"E-commerce Image Knowledge Base\",\"description_main\":\"From shooting to uploading, from cutout to export — here are the most common questions and practical tips for e-commerce sellers working with product images.\",\"articles\":{\"product-photo-tips\":{\"tag\":\"Photography\",\"title\":\"Product Photo Tips: 6 Points for Cleaner Cutouts\",\"excerpt\":\"Good product photos are the foundation of clean cutouts. This article covers lighting, background, angle, and composition for photos that are easier to process.\",\"date\":\"2026-07-31\"},\"transparent-png-guide\":{\"tag\":\"Basics\",\"title\":\"Transparent PNG Complete Guide: Everything E-commerce Sellers Need to Know\",\"excerpt\":\"What is a transparent PNG? Why do e-commerce platforms need it? How to make one? This guide explains it all in plain language.\",\"date\":\"2026-07-31\"},\"ecommerce-image-specs\":{\"tag\":\"Platform Specs\",\"title\":\"E-commerce Platform Image Specs: Sizes, Ratios, and White Background Requirements\",\"excerpt\":\"Amazon, eBay, Shopify, Taobao, Pinduoduo — different platforms have different product image requirements. This guide covers them all.\",\"date\":\"2026-07-31\"},\"ai-vs-traditional-cutout\":{\"tag\":\"Comparison\",\"title\":\"AI vs Traditional Background Removal: Why Browser-Based Is the Future\",\"excerpt\":\"From Photoshop manual to online services to browser AI — a comprehensive comparison across speed, precision, cost, and privacy.\",\"date\":\"2026-08-01\"},\"white-background-tutorial\":{\"tag\":\"Tutorial\",\"title\":\"Complete White Background Product Image Tutorial: From Shoot to Listing\",\"excerpt\":\"Step-by-step guide to creating white-background product images that meet Taobao, JD, Amazon, and other platform standards.\",\"date\":\"2026-08-02\"},\"batch-product-photo-tips\":{\"tag\":\"Efficiency\",\"title\":\"5 Efficient Tips for Batch Processing Product Photos: Hours to Minutes\",\"excerpt\":\"Practical tips on standardized shooting, batch cutout tools, platform presets, and processing pipelines to dramatically improve efficiency.\",\"date\":\"2026-08-03\"},\"remove-background-free\":{\"tag\":\"Tool Comparison\",\"title\":\"How to Choose a Free Online Background Remover: A Real Comparison of 6 Tools\",\"excerpt\":\"Compare mainstream free background removers on accuracy, privacy, batch power, and export formats so you can choose without regrets.\",\"date\":\"2026-08-04\"},\"png-vs-jpg\":{\"tag\":\"Format Guide\",\"title\":\"PNG or JPG for E-commerce Images? A Clear Guide with a Comparison Table\",\"excerpt\":\"Transparent cutouts need PNG; photo-style hero images save space with JPG. A comparison table for e-commerce format decisions.\",\"date\":\"2026-08-04\"},\"clothing-photo\":{\"tag\":\"Apparel\",\"title\":\"Apparel Product Photos: A Start-to-Finish Shoot, Cutout, and White-Background Workflow\",\"excerpt\":\"A complete workflow for clothing, shoes, and bags — from lighting and shooting to AI cutout and white-background compositing.\",\"date\":\"2026-08-04\"},\"conversion-tips\":{\"tag\":\"Conversion\",\"title\":\"7 Practical Tips to Optimize Product Hero Images and Boost Conversion\",\"excerpt\":\"Your hero image makes the first impression. Seven actionable tips — from composition and whitespace to edge cleanup and lifestyle shots.\",\"date\":\"2026-08-04\"},\"ai-background-remover\":{\"tag\":\"AI Cutout\",\"title\":\"Best AI Background Remover 2026: Hands-on Test of 6 Tools\",\"excerpt\":\"We test 6 popular AI background removers on accuracy, privacy, and price to help you pick the right one.\",\"date\":\"2026-08-04\"},\"ai-image-upscaler\":{\"tag\":\"AI Upscale\",\"title\":\"Best AI Image Upscaler: 5 Tools to Enlarge Photos Without Loss\",\"excerpt\":\"5 AI super-resolution tools that turn small, blurry product photos crisp — no visible quality loss.\",\"date\":\"2026-08-04\"},\"ai-id-photo\":{\"tag\":\"ID Photo\",\"title\":\"AI ID Photo Maker: Change Background & Size in One Click\",\"excerpt\":\"Make compliant ID photos from your phone — swap red/blue/white backgrounds and resize to standard sizes instantly.\",\"date\":\"2026-08-04\"},\"ai-watermark-remover\":{\"tag\":\"Watermark\",\"title\":\"Best AI Watermark Remover: Clear Watermarks Instantly\",\"excerpt\":\"We test AI watermark removers that clear marks in one click, with a note on copyright boundaries.\",\"date\":\"2026-08-04\"},\"ai-old-photo-restoration\":{\"tag\":\"Photo Repair\",\"title\":\"AI Old Photo Restoration: Turn Faded Photos Sharp Again\",\"excerpt\":\"A roundup of AI tools that denoise, colorize, and repair scratches on old photos.\",\"date\":\"2026-08-04\"},\"ai-product-background\":{\"tag\":\"Background\",\"title\":\"AI Product Background Replacement: White & Scene in One Click\",\"excerpt\":\"Swap to white or generate scene backgrounds for e-commerce product images with AI, doubling your efficiency.\",\"date\":\"2026-08-04\"},\"ai-image-compressor\":{\"tag\":\"Compress\",\"title\":\"AI Image Compressor: Shrink Size Without Losing Quality\",\"excerpt\":\"AI compressors cut file size with no visible loss — faster pages and better conversion.\",\"date\":\"2026-08-04\"},\"ai-art-generator\":{\"tag\":\"AI Art\",\"title\":\"Top 10 AI Art Generators in 2026\",\"excerpt\":\"A 2026 roundup of 10 mainstream AI art tools, with tips on choosing and commercial licensing.\",\"date\":\"2026-08-04\"},\"ai-ecommerce-main-image\":{\"tag\":\"Hero Image\",\"title\":\"AI Ecommerce Main Image Generator: Pro Hero Shots in 10s\",\"excerpt\":\"Generate professional e-commerce hero images from templates in 10 seconds with AI, boosting click-through.\",\"date\":\"2026-08-04\"},\"free-ai-tools-roundup\":{\"tag\":\"Tool Kit\",\"title\":\"Free AI Tools for Sellers: 12 Must-Have Apps\",\"excerpt\":\"12 free or free-tier AI tools for cutout, design, and copy — enough to start a small store.\",\"date\":\"2026-08-04\"},\"ai-scene-composite\":{\"tag\":\"Scene Composite\",\"title\":\"AI Background Swap & Scene Composite: One-Click Lifestyle Product Images\",\"excerpt\":\"Composite your cutout onto a lifestyle scene to build desire. From scene choice and light matching to shadow and perspective, five steps to natural, premium composites.\",\"date\":\"2026-08-04\"},\"best-free-ai-cutout\":{\"tag\":\"Tool Comparison\",\"title\":\"5 Free AI Background Removers Tested (2026): Which Is Actually Good?\",\"excerpt\":\"Free tools hide three traps: watermark, low-res, capped counts. We tested five types and show how to get clean, high-res cuts on a free tier.\",\"date\":\"2026-08-05\"},\"ai-bg-psychology\":{\"tag\":\"Visual Psychology\",\"title\":\"Why AI Backgrounds Make You Look Pro: 3 Visual Psychology Truths\",\"excerpt\":\"Same person, different background, double the pro read. Primacy effect, color emotion, whitespace — 3 rules to look pro with one click.\",\"date\":\"2026-08-05\"},\"ai-vs-manual-editing\":{\"tag\":\"Productivity\",\"title\":\"Still Cutting Out by Hand? 6 AI Photo Tools Save You 5 Minutes\",\"excerpt\":\"Manual cutout: 20 min. AI: 3 sec. Tally the time, quality, and attention you save, and meet 6 AI photo tools that speed you up.\",\"date\":\"2026-08-05\"},\"ai-id-photo-bg\":{\"tag\":\"ID Photo\",\"title\":\"AI ID Photo Background Swap: 3 Minutes at Home, Save $30\",\"excerpt\":\"How to swap red/blue/white backgrounds, which pitfalls to avoid, and print sizes to use. A hands-on guide to ID photos at home.\",\"date\":\"2026-08-05\"},\"old-photo-emotion\":{\"tag\":\"Emotional Value\",\"title\":\"Old Photo Restoration AI: Is Clearing Memories Worth It?\",\"excerpt\":\"A blurry photo, a clear face. On the emotional value of AI old-photo restoration — and how to do it tastefully.\",\"date\":\"2026-08-05\"},\"ecommerce-ctr-ai\":{\"tag\":\"E-commerce Growth\",\"title\":\"7 AI Tools for Sellers: Boost Product CTR by 200%\",\"excerpt\":\"The main image drives clicks, clicks drive sales. Seven AI image directions plus A/B testing to make product shots that sell.\",\"date\":\"2026-08-05\"},\"ai-poster-design\":{\"tag\":\"Poster Design\",\"title\":\"Can Beginners Design Posters? 4 AI Poster Tools Reviewed\",\"excerpt\":\"No Photoshop? Finish a poster in 10 minutes. We review four AI poster tools and share three layout rules for a premium look.\",\"date\":\"2026-08-05\"},\"underrated-ai-tools\":{\"tag\":\"Tool Roundup\",\"title\":\"10 Underrated AI Tools — #6 Will Surprise You\",\"excerpt\":\"Ten quiet but handy AI tools: cutout, watermark removal, compress, colorize, background swap… #6, one-click background swap, is the surprise.\",\"date\":\"2026-08-05\"},\"ai-replace-designers\":{\"tag\":\"Industry Insight\",\"title\":\"Will AI Replace Designers? The Honest 2026 Answer\",\"excerpt\":\"AI takes repetitive execution, not thinking designers. What gets replaced, what doesn't, and three tips for practitioners.\",\"date\":\"2026-08-05\"},\"ai-tools-leave-early\":{\"tag\":\"Work Method\",\"title\":\"Why People Using AI Tools Leave 2 Hours Earlier\",\"excerpt\":\"Same 8 hours, AI users leave at six. Automate the mechanical, speed up editing, and give time back to thinking — the logic of leaving early.\",\"date\":\"2026-08-05\"},\"remove-background-online\":{\"tag\":\"Background Removal\",\"title\":\"Remove the background from a photo online\",\"excerpt\":\"Want to remove the background from a photo online without installing anything? Drop in any image and get a clean cutout in seconds with edit-photo.\",\"date\":\"2026-08-05\"},\"transparent-png-online\":{\"tag\":\"Transparent PNG\",\"title\":\"Make a transparent PNG online in seconds\",\"excerpt\":\"Need a transparent PNG for a logo, product shot, or meme? Make one online in seconds with edit-photo — no Photoshop.\",\"date\":\"2026-08-05\"},\"batch-remove-background-online\":{\"tag\":\"Batch Remove\",\"title\":\"Remove backgrounds from many photos at once\",\"excerpt\":\"A folder of photos all need the background removed? Process many at once and download together with edit-photo's batch tool.\",\"date\":\"2026-08-05\"},\"upscale-photo-online\":{\"tag\":\"Photo Upscale\",\"title\":\"Upscale a blurry photo online in one click\",\"excerpt\":\"Blurry shot or tiny screenshot? Upscale a photo online with edit-photo and turn fuzzy into sharp in seconds, no install.\",\"date\":\"2026-08-05\"},\"remove-watermark-online\":{\"tag\":\"Watermark\",\"title\":\"Remove a watermark from a photo online\",\"excerpt\":\"Downloaded image with a watermark, or your own shot stamped over? Remove it online with edit-photo in seconds, no Photoshop.\",\"date\":\"2026-08-05\"},\"compress-image-online\":{\"tag\":\"Compress\",\"title\":\"Compress an image online without losing quality\",\"excerpt\":\"Image too big to send? Compress it online with edit-photo — quality barely changes, but the size drops a lot.\",\"date\":\"2026-08-05\"},\"colorize-photo-online\":{\"tag\":\"Photo Colorize\",\"title\":\"Colorize a black and white photo online\",\"excerpt\":\"A faded B&W family photo? Colorize it online with edit-photo in one click — natural tones, no retouching skills.\",\"date\":\"2026-08-05\"},\"id-photo-change-outfit-online\":{\"tag\":\"ID Outfit\",\"title\":\"Change clothes in an ID photo online\",\"excerpt\":\"ID photo needs formal wear but you're in a tee? Change clothes online with edit-photo at home, and swap the backdrop too.\",\"date\":\"2026-08-05\"},\"case-etsy-seller\":{\"tag\":\"Case Study\",\"title\":\"Case study: a handmade seller made 300 product photos in a week with edit-photo\",\"excerpt\":\"Maker A used edit-photo to batch cutout, upscale, and compress — 300 white-bg photos in a week, with better conversion.\",\"date\":\"2026-08-05\"},\"case-real-estate\":{\"tag\":\"Case Study\",\"title\":\"Case study: an agent doubled listing clicks with edit-photo\",\"excerpt\":\"Agent Zhou used edit-photo to cutout, swap scenes, and boost clarity — refreshed listings doubled clicks and showings.\",\"date\":\"2026-08-05\"},\"case-content-creator\":{\"tag\":\"Case Study\",\"title\":\"Case study: a creator posts daily without staying up with edit-photo\",\"excerpt\":\"Creator Jay pipelined de-watermark, upscale, and compress in edit-photo — daily posts done before midnight.\",\"date\":\"2026-08-05\"},\"ai-tools-thinking-trap\":{\"tag\":\"Cognitive Psychology\",\"title\":\"Are AI Tools Stealing Your Ability to Think? 5 Warnings from Psychologists\",\"excerpt\":\"Convenience hides cognitive traps. We break down, from a psychology angle, how AI tools breed dependence and blunt judgment — and how to protect yourself.\",\"date\":\"2026-08-06\"},\"ai-hallucination-explained\":{\"tag\":\"AI Explained\",\"title\":\"Why Does AI Make Things Up? Understanding LLM Hallucinations\",\"excerpt\":\"Hallucination isn't a bug — it's how language models work. Understand it, and you won't be misled by AI's confidence.\",\"date\":\"2026-08-06\"},\"free-ai-tools-hidden-cost\":{\"tag\":\"Tool Pitfalls\",\"title\":\"Are Free AI Tools Really Free? 5 Hidden Costs Revealed\",\"excerpt\":\"Free is often the most expensive. We break down the hidden costs of free AI tools — privacy, watermarks, quotas, and quality.\",\"date\":\"2026-08-06\"},\"prompt-psychology\":{\"tag\":\"Prompting\",\"title\":\"People Who Write Good Prompts Earn More: 5 Psychology Principles\",\"excerpt\":\"Prompting isn't magic — it's communication. Use psychology to write instructions AI actually understands.\",\"date\":\"2026-08-06\"},\"ai-take-your-job-myth\":{\"tag\":\"Industry View\",\"title\":\"Will AI Take Your Job? 3 Truths the Data Tells Us\",\"excerpt\":\"Panic comes from the unknown. Real data on AI's impact on employment — the anxious and the obsolete aren't the same group.\",\"date\":\"2026-08-06\"},\"ai-content-detection-seo\":{\"tag\":\"SEO & Content\",\"title\":\"Is Your Article Written by AI? How Search Engines Detect AI Content\",\"excerpt\":\"AI content isn't low quality by default, but algorithms are evolving. Understand detection so your content stays both efficient and safe.\",\"date\":\"2026-08-06\"},\"ai-productivity-paradox\":{\"tag\":\"Productivity Psychology\",\"title\":\"Why AI Made You Busier: 3 Counterintuitive Truths About Productivity Tools\",\"excerpt\":\"Tools meant to save time trap us in infinite output. The psychology behind the productivity paradox — and how to break it.\",\"date\":\"2026-08-06\"},\"ai-tools-you-actually-need\":{\"tag\":\"Tool Picks\",\"title\":\"300 AI Tools, but You Only Need These 8\",\"excerpt\":\"Tool overload causes anxiety. We curate 8 AI tools covering daily creation and work — fewer, better.\",\"date\":\"2026-08-06\"},\"ai-creativity-engine\":{\"tag\":\"Creativity\",\"title\":\"AI Isn't a Creativity Killer — It's an Idea Engine\",\"excerpt\":\"Afraid AI replaces inspiration? Used differently, it becomes your most tireless co-creator.\",\"date\":\"2026-08-06\"},\"ai-privacy-safety\":{\"tag\":\"Privacy & Safety\",\"title\":\"Is It Safe to Feed Photos to AI? Privacy Risks and How to Protect Yourself\",\"excerpt\":\"Upload equals consent? Know the privacy boundaries of AI tools, and use local processing to protect your images.\",\"date\":\"2026-08-06\"}},\"readMore\":\"Read article\",\"backToBlog\":\"Back to guides\",\"relatedTitle\":\"Related articles\"}"),
		metadata: {
			"home": {
				"title": "Free AI Background Remover for Product Photos | edit-photo",
				"description": "Remove product photo backgrounds free in your browser. Create transparent PNG and marketplace-ready images with local AI—no image uploads or registration."
			},
			"batch": {
				"title": "Batch Cutout",
				"description": "Process multiple product images locally in your browser, auto-queue, and download transparent PNGs."
			},
			"pricing": {
				"title": "Pricing",
				"description": "edit-photo free and pro plans for product image background removal."
			},
			"auth": {
				"title": "Sign in",
				"description": "Register or sign in to your edit-photo account."
			},
			"account": {
				"title": "My Account",
				"description": "Manage your edit-photo account and plan."
			},
			"contact": {
				"title": "Contact",
				"description": "Contact edit-photo via email."
			},
			"privacy": {
				"title": "Privacy",
				"description": "How edit-photo processes images locally and protects user privacy."
			},
			"blog": {
				"title": "Guides & Knowledge",
				"description": "Product photo tips, transparent PNG knowledge, and e-commerce platform image specs — practical guides from edit-photo."
			}
		}
	},
	zh: {
		common: {
			"brand": {
				"name": "edit-photo",
				"mark": "橙",
				"tagline": "本地 AI · 免费"
			},
			"nav": {
				"label": "主导航",
				"home": "首页",
				"howItWorks": "使用说明",
				"batch": "批量处理",
				"pricing": "专业版",
				"contact": "联系我们",
				"blog": "使用指南",
				"privacy": "隐私说明",
				"singleCutout": "单张抠图",
				"batchVersion": "批量版",
				"proVersion": "专业版"
			},
			"footer": {
				"copyright": "© 2026 edit-photo",
				"guides": "使用指南",
				"pricing": "专业版方案",
				"privacy": "隐私说明",
				"contact": "联系我们",
				"disclaimer": "免责声明",
				"clearCache": "清除模型缓存",
				"cacheCleared": "缓存已清除"
			},
			"language": {
				"switch": "语言",
				"english": "English",
				"chinese": "中文"
			},
			"trust": { "label": "产品特点" }
		},
		home: {
			"hero": {
				"eyebrow": "AI 智能商品抠图",
				"title": "商品图，一键",
				"titleHighlight": "干净抠出",
				"description": "上传图片，AI 自动移除背景。本地处理，无需注册，直接下载透明 PNG。",
				"trustBrowser": "✓ 浏览器本地处理",
				"trustFullSize": "✓ 原图尺寸导出",
				"trustNoSignup": "✓ 无需注册"
			},
			"workbench": {
				"kicker": "在线工具 / 单张抠图",
				"title": "上传商品图片",
				"privacyNote": "● 图片不会上传",
				"uploadButton": "选择商品图片",
				"dropzoneTitle": "拖一张商品图到这里",
				"dropzoneHint": "或点击选择、直接粘贴截图",
				"dropzoneHintSize": "支持 JPG / PNG / WebP · 最大 12MB",
				"errorFormat": "请选择 JPG、PNG 或 WebP 图片",
				"errorSize": "图片不能超过 12MB，请压缩后再试"
			},
			"processing": {
				"loadingModel": "正在加载本地 AI 模型",
				"cleaningEdges": "AI 正在净化边缘与背景杂点",
				"firstTimeHint": "首次初始化可能需要 1–2 分钟，请继续保持页面打开。",
				"keepOpenHint": "请保持页面打开，图片始终留在你的设备上。",
				"waiting": "已等待",
				"seconds": "{n} 秒",
				"minutesSeconds": "{m} 分 {s} 秒",
				"original": "原图",
				"transparent": "透明底",
				"resultBadge": "透明底",
				"compareLabel": "原图与透明图对比位置 {position}%",
				"timeoutError": "本地 AI 启动超过 2 分钟，浏览器运行环境可能已卡住。请刷新页面后重新处理。",
				"memoryError": "设备可用内存不足。请关闭其他页面，或换一张尺寸更小的图片后重试。",
				"genericError": "本地模型没有加载完成。诊断版本：{version}；诊断码：{code}。请点击重试。",
				"scanOriginal": "原图",
				"scanTransparent": "透明底"
			},
			"result": {
				"downloadPng": "下载 PNG",
				"zoomHint": "查看细节",
				"zoomHintDrag": "拖动查看细节",
				"zoomOut": "− 缩小",
				"zoomIn": "＋ 放大",
				"zoomReset": "当前缩放 {zoom}%，点击恢复原始比例",
				"panMode": "拖动图片",
				"panning": "正在拖动",
				"viewSide": "并排查看",
				"viewCompare": "滑动对比",
				"cleanup": "边缘净化",
				"cleanupStandard": "标准",
				"cleanupStrong": "强力去杂",
				"cleanupShadow": "保留阴影",
				"cleanupProcessing": "正在重新净化…",
				"cleanupStandardHint": "适合大多数商品图片",
				"cleanupStrongHint": "适合复杂纹理与地面杂点",
				"cleanupShadowHint": "适合需要自然落地感的商品",
				"manualEdit": {
					"title": "边缘还有杂点或缺口？",
					"description": "用擦除与恢复画笔做最后修正，支持撤销。",
					"button": "手动修边"
				}
			},
			"product": {
				"kicker": "02 / 电商成品图",
				"title": "一键生成平台白底主图",
				"platformLabel": "选择电商平台",
				"previewLabel": "白底主图预览",
				"bgColor": "背景颜色",
				"productSize": "商品大小",
				"horizontal": "左右位置",
				"vertical": "上下位置",
				"addShadow": "添加自然阴影",
				"downloadTransparent": "下载透明 PNG",
				"downloadProduct": "下载白底主图",
				"exporting": "正在生成…",
				"processAnother": "再处理一张"
			},
			"feedback": {
				"title": "这张抠图能直接使用吗？",
				"privacy": "反馈不包含你的图片",
				"satisfied": "满意",
				"unsatisfied": "不满意",
				"thanks": "谢谢反馈，我们会用它继续优化商品图效果。",
				"issues": {
					"artifacts": "有杂点",
					"missingEdges": "边缘缺失",
					"shadowError": "阴影错误",
					"transparentObject": "透明物体",
					"subjectError": "主体识别错误"
				},
				"submit": "提交问题"
			},
			"error": {
				"title": "这次没处理成功",
				"retry": "重试处理",
				"reload": "刷新页面重试",
				"chooseAnother": "重新选择"
			},
			"stats": {
				"stepsLabel": "3 步",
				"stepsDesc": "上传 → 自动抠图 → 下载",
				"uploadLabel": "0 上传",
				"uploadDesc": "处理过程只发生在本地",
				"imageLabel": "1 张起",
				"imageDesc": "先免费验证真实商品图"
			},
			"nextSteps": {
				"eyebrow": "接下来要做的事",
				"title": "不是多一个工具，是少一堆重复劳动。",
				"batchBadge": "体验版已开放",
				"batchTitle": "批量商品白底图",
				"batchDesc": "一次选择多张商品图，自动排队抠图，完成后打包下载透明 PNG。"
			}
		},
		batch: {
			"title": "批量抠图",
			"description": "多张商品图片在浏览器本地自动排队抠图，打包下载透明 PNG。",
			"hero": {
				"eyebrow": "02 / 批量工作台",
				"titleLine1": "多张商品图，",
				"titleLine2": "排队一次抠完。",
				"subtitle": "一次选择最多 {max} 张，AI 在浏览器内逐张处理，图片不会上传。"
			},
			"stats": {
				"label": "批量任务状态",
				"selectedLabel": "已选择",
				"completedLabel": "已完成",
				"pendingLabel": "待处理"
			},
			"dropzone": {
				"title": "把多张商品图拖到这里",
				"hint": "支持 JPG / PNG / WebP · 单张最大 12MB",
				"button": "选择多张图片"
			},
			"progress": {
				"batchProgress": "批次进度",
				"estimatedRemaining": "预计剩余",
				"processingMode": "处理模式",
				"multiThread": "多线程加速",
				"stableMode": "稳定模式",
				"processing": "处理中 {completed}/{total}",
				"starting": "开始处理 {n} 张"
			},
			"items": {
				"queued": "等待处理",
				"processing": "处理中 {progress}%",
				"done": "处理完成 · {duration}",
				"error": "处理失败，可单独重试",
				"preview": "预览",
				"download": "下载",
				"retry": "单独重试",
				"remove": "移除",
				"resultAlt": "抠图结果",
				"sourceAlt": "原图"
			},
			"preview": {
				"title": "批量结果预览",
				"close": "关闭结果预览",
				"original": "原图",
				"transparent": "透明底",
				"sourceAlt": "批量商品原图",
				"resultAlt": "批量抠图结果",
				"manualEdit": "手动修边",
				"downloadPng": "下载透明 PNG"
			},
			"actions": {
				"processAll": "全部处理",
				"downloadAll": "全部下载",
				"downloadAllCount": "打包下载 {count} 张",
				"packaging": "正在打包…",
				"clear": "清空任务"
			},
			"nav": {
				"label": "批量版导航",
				"single": "单张抠图",
				"pro": "专业版",
				"contact": "联系我们",
				"pill": "批量体验版"
			},
			"notices": {
				"maxBatch": "体验版每批最多 {max} 张，请先处理或清空当前任务。",
				"added": "已加入 {added} 张图片。",
				"addedSkipped": "已加入 {added} 张，另有 {skipped} 张因格式、大小或数量限制被跳过。",
				"modelLoading": "正在准备本地 AI 模型；当前设备将采用稳定的单任务模式。",
				"modelFail": "本地模型没有加载完成，请检查网络后重试。",
				"done": "本批次处理完成，可逐张预览、修边或打包下载。",
				"doneWithFailures": "本轮完成，{failed} 张失败，可在对应图片上单独重试。",
				"zipFail": "打包下载没有完成，请逐张下载或稍后重试。"
			},
			"download": {
				"zipName": "edit-photo-批量抠图-{count}张.zip",
				"transparentSuffix": "-透明底.png",
				"defaultName": "product",
				"gridLabel": "批量图片任务"
			},
			"duration": {
				"estimating": "正在估算",
				"completed": "已完成",
				"approx": "约",
				"seconds": "秒",
				"minutes": "分"
			},
			"brand": { "homeLabel": "返回edit-photo首页" }
		},
		pricing: {
			"title": "专业版方案",
			"description": "edit-photo免费和专业版方案。",
			"eyebrow": "方案与定价",
			"title_main": "简单透明的定价",
			"free": {
				"name": "免费版",
				"price": "¥0",
				"period": "/月",
				"features": [
					"单张与批量抠图",
					"透明 PNG 与白底图",
					"手动修边和边缘净化",
					"每次最多 5 张批量"
				],
				"cta": "免费开始"
			},
			"pro": {
				"name": "专业版",
				"price": "¥39",
				"period": "/月",
				"badge": "内测",
				"features": [
					"每月 500 次额度",
					"每次 50 张批量",
					"强力与阴影净化模式",
					"手动修边",
					"全部平台预设"
				],
				"cta": "开通专业版"
			},
			"team": {
				"name": "团队版",
				"price": "¥199",
				"period": "/月",
				"features": [
					"每月 3000 次额度",
					"每次 200 张批量",
					"5-20 名团队成员",
					"API 访问",
					"自定义预设"
				],
				"cta": "联系销售"
			},
			"faq": {
				"title": "常见问题",
				"q1": "免费版真的免费吗？",
				"a1": "是的。单张和批量抠图永久免费，无需信用卡。",
				"q2": "抠图结果可以商用吗？",
				"a2": "可以。所有输出的图片归你自由使用。",
				"q3": "计费方式是什么？",
				"a3": "按月订阅，通过 Stripe 支付。随时取消，额度按计费周期重置。"
			},
			"form": {
				"eyebrow": "专业版内测申请",
				"title": "用 1 分钟告诉我们，你每天在重复什么。",
				"description": "我们会优先邀请需求匹配的用户。提交后可继续添加微信，便于沟通真实图片场景。",
				"promiseTitle": "只收集必要信息",
				"promiseDesc": "不上传图片，不发送营销短信，不会自动扣费。",
				"successTitle": "申请已收到",
				"successDesc": "下一步请添加微信并备注「专业版内测」，我们会结合你的场景安排体验。",
				"successLink": "查看微信二维码",
				"roleLabel": "你的工作角色",
				"selectPlaceholder": "请选择",
				"roleOptions": [
					"电商运营 / 店主",
					"新媒体编辑",
					"摄影 / 设计",
					"团队负责人",
					"其他"
				],
				"volumeLabel": "每月大约处理多少张图片",
				"volumeOptions": [
					"1–20 张",
					"21–100 张",
					"101–500 张",
					"500 张以上"
				],
				"needsLabel": "最希望解决的问题（可多选）",
				"needOptions": [
					"复杂背景抠图",
					"批量处理提速",
					"平台主图模板",
					"图片尺寸统一",
					"品牌背景替换",
					"团队协作"
				],
				"contactLabel": "联系方式",
				"channelWechat": "微信号",
				"channelEmail": "电子邮箱",
				"contactInputPlaceholder": "微信号或邮箱",
				"contactInputHint": "用于内测邀请",
				"noteLabel": "其他需求（选填）",
				"notePlaceholder": "例如：主要处理服装图，希望保留自然阴影",
				"consentText": "我已阅读并同意",
				"privacyLink": "隐私说明",
				"honeypotLabel": "网站",
				"submitButton": "提交内测申请",
				"submitting": "正在提交…",
				"errorMessage": "暂时没有提交成功，请稍后重试，或直接通过联系页添加微信。"
			}
		},
		auth: {
			"title": "注册登录",
			"description": "注册或登录账户，管理你的产品权益。",
			"login": {
				"eyebrow": "欢迎回来",
				"title": "登录",
				"description": "继续使用你的账户与产品权益，抠图过程仍然不会上传原图。",
				"submit": "登录",
				"switchLabel": "还没有账户？",
				"switchAction": "免费注册"
			},
			"register": {
				"eyebrow": "创建账户",
				"title": "保存你的产品权益",
				"description": "注册只用于识别账户和承载会员权益，商品图片始终留在浏览器本地。",
				"submit": "免费注册",
				"switchLabel": "已有账户？",
				"switchAction": "直接登录"
			},
			"form": {
				"displayName": "显示名称",
				"displayNamePlaceholder": "例如：小橙店主",
				"email": "邮箱",
				"emailPlaceholder": "name@example.com",
				"password": "密码",
				"passwordPlaceholder": "至少 10 位，建议包含数字和符号",
				"confirmPassword": "确认密码",
				"confirmPasswordPlaceholder": "再次输入密码",
			"submitting": "请稍候…",
			"forgotPassword": "忘记密码？",
				"passwordMismatch": "两次输入的密码不一致。",
				"networkError": "网络暂时不可用，请稍后重试。",
				"termsPrefix": "注册或登录即表示你已阅读并同意",
				"privacyLink": "隐私说明"
			},
			"trust": {
				"eyebrow": "隐私与安全",
				"title": "登录，不改变本地处理方式",
				"points": [
					"原图和结果不上传服务器",
					"密码经过加盐和高强度派生处理",
					"会话 Cookie 无法被页面脚本读取"
				]
			},
			"backToTool": "返回抠图工具",
			"errors": {
				"INVALID_CREDENTIALS": "邮箱或密码不正确。",
				"RATE_LIMITED": "尝试次数过多，请稍后再试。",
				"EMAIL_EXISTS": "该邮箱已经注册，请直接登录。",
				"WEAK_PASSWORD": "密码至少需要 10 位，并同时包含字母和数字。",
				"INVALID_INPUT": "请检查名称、邮箱和密码是否填写正确。",
				"ACCOUNT_DISABLED": "该账户暂时不可用，请联系我们。",
				"STORE_FAILED": "服务器错误，请稍后重试。",
				"default": "操作没有完成，请稍后重试。",
				"network": "网络暂时不可用，请稍后重试。"
			}
		},
		account: {
			"title": "我的账户",
			"description": "管理你的edit-photo账户与专业版申请。",
			"eyebrow": "账户中心",
			"greeting": "你好，{name}",
			"description_main": "账户只保存登录身份和产品权益，你的商品图片仍只在浏览器本地处理。",
			"profile": {
				"label": "当前账户",
				"synced": "✓ 账户已安全登录"
			},
			"plan": {
				"label": "当前方案",
				"free": "免费体验版",
				"description": "单张与批量抠图继续在本地运行，不上传原图。",
				"features": [
					"透明 PNG 与电商白底图",
					"手动修边和边缘净化",
					"每次最多 5 张批量"
				],
				"viewPro": "查看专业版",
				"quotaLabel": "月额度",
				"perMonth": "次/月",
				"batchLabel": "批量上限",
				"images": "张"
			},
			"privacy": {
				"label": "隐私承诺",
				"title": "登录不改变本地处理方式",
				"description": "登录用于识别账户和承载未来权益，不会把你选择的原图或抠图结果上传到edit-photo服务器。",
				"viewPrivacy": "查看隐私说明"
			},
			"actions": {
				"startCutout": "开始抠图",
				"logout": "退出登录",
				"loggingOut": "正在退出…"
			},
			"loading": "正在读取账户信息…"
		},
		contact: {
			"title": "联系我们",
			"description": "通过微信或电子邮件联系edit-photo。",
			"eyebrow": "联系与合作",
			"title_main": "联系我们",
			"description_main": "批量抠图、商务合作或产品建议，欢迎扫码添加微信，也可以通过邮箱联系我们。",
			"emailLabel": "联系邮箱",
			"email": "matchyang36@gmail.com",
			"wechatNote": "添加微信时请备注\"edit-photo\"，方便及时通过。",
			"wechatQr": "微信扫码添加好友",
			"qrAlt": "edit-photo 微信联系二维码，扫码添加微信好友",
			"backButton": "返回抠图工具"
		},
		privacy: {
			"title": "隐私说明",
			"description": "了解edit-photo如何在浏览器本地处理图片和保护用户隐私。",
			"eyebrow": "隐私与数据说明",
			"title_main": "你的商品图片，留在你的设备里。",
			"lead": "edit-photo当前使用浏览器本地模型完成抠图。选择的原图和生成结果不会上传到edit-photo服务器。",
			"sections": {
				"processing": {
					"title": "图片处理",
					"body": "单张与批量抠图均在浏览器中运行。关闭或刷新页面后，临时预览和处理结果可能被清除，请及时下载需要保留的文件。"
				},
				"model": {
					"title": "模型文件与浏览器缓存",
					"body": "首次使用时，浏览器需要按需下载约 66MB 的本地 AI 模型和运行组件。网站会使用版本化浏览器缓存缩短后续等待时间，并在模型升级时清理旧版本；缓存中不包含你的商品图片。你也可以在网站页脚主动清除模型缓存。"
				},
				"feedback": {
					"title": "质量反馈",
					"body": "如果你提交\"满意\"或问题类型，系统只记录所选反馈、处理模式和基础诊断信息，不包含原图或抠图结果。"
				},
				"auth": {
					"title": "注册与登录",
					"body": "edit-photo只保存账户邮箱、显示名称、经过加盐和高强度派生处理的密码凭据、方案状态与必要的登录时间。登录会话保存在安全的 HttpOnly Cookie 中，网站无法读取你的明文密码。"
				},
				"analytics": {
					"title": "访问分析",
					"body1": "为了解网站使用情况并改进产品，我们会使用第一方匿名访客编号记录访问时间、访问页面、来源网站、设备类型，以及由 Cloudflare 提供的国家、地区和城市级近似位置。登录后，匿名访客编号可能与账户关联，用于统计注册、抠图和下载等关键功能的使用情况。",
					"body2": "访问分析不会保存你的原始 IP 地址，也不会包含原图或抠图结果。浏览器启用\"全局隐私控制\"或\"请勿跟踪\"信号时，网站不会写入访问分析记录。"
				},
				"proInterest": {
					"title": "专业版内测申请",
					"body": "当你主动申请专业版内测时，我们会保存你填写的工作角色、图片处理量、需求、联系方式和补充说明，用于筛选内测用户、产品调研与后续联系。你可以联系我们申请更正或删除。"
				},
				"contactUs": {
					"title": "主动联系我们",
					"body": "当你通过微信或电子邮件联系我们时，相关信息由对应通信平台处理。请不要发送不希望我们查看的敏感图片或资料。"
				},
				"updates": {
					"title": "说明更新",
					"body": "如果未来增加账号、云端存储或支付功能，我们会在上线前更新本说明，并明确告知数据用途和保存方式。"
				},
				"cookies": {
					"title": "Cookie 与第三方广告",
					"body1": "本网站使用 Cookie 和类似技术来改善用户体验、分析流量并展示广告。Google AdSense 等第三方广告供应商可能会使用 Cookie 来根据你过往的访问记录或其他网站的访问记录为你展示广告。",
					"body2": "Google 使用 Cookie 来存储广告偏好、投放频率等信息，以便根据你的兴趣展示更相关的广告。你可以通过浏览器设置管理或删除 Cookie，也可以访问 Google 广告设置页面个性化广告偏好或停用个性化广告。",
					"body3": "第三方广告供应商（包括 Google）使用 Cookie 投放广告时，会受到相关法律法规约束。如需了解 Google 如何使用数据，请参阅 Google 隐私政策与合作伙伴站点。"
				}
			},
			"actions": {
				"backToTool": "返回免费抠图",
				"askPrivacy": "咨询隐私问题"
			},
			"links": {
				"adSettings": "Google 广告设置",
				"partnerPolicy": "Google 隐私政策与合作伙伴站点"
			},
			"updated": "更新日期：2026 年 8 月 1 日"
		},
		disclaimer: {
			"title": "免责声明",
			"description": "edit-photo 工具使用与结果相关的免责说明。",
			"eyebrow": "使用免责声明",
			"title_main": "AI 抠图结果，仅供参考，请自行确认。",
			"lead": "edit-photo 通过浏览器本地 AI 模型提供图片背景移除功能。以下说明本工具的使用边界与责任范围，使用本网站即表示你理解并同意这些条款。",
			"sections": {
				"resultAccuracy": {
					"title": "结果不保证",
					"body": "抠图效果取决于原图质量、主体复杂度与边缘情况。对于发丝、半透明物体、细小镂空、低对比度或模糊图片，结果可能不完整或存在瑕疵。本工具不保证 100% 准确的抠图结果。"
				},
				"userRisk": {
					"title": "使用风险自担",
					"body": "你需自行检查抠图结果是否满足用途，并在正式使用前确认其适用性。因使用或依赖本工具输出而产生的任何损失或后果，由你自行承担。"
				},
				"prohibitedUse": {
					"title": "禁用场景",
					"body": "本工具不适用于身份、法律、医疗、金融等敏感或证件类图片的权威处理，也不应用于任何违法或侵犯他人权益的用途。请确保你的使用符合当地法律法规。"
				},
				"asIs": {
					"title": "按现状提供",
					"body": "本服务按「现状」提供，不保证连续可用、无中断、无误差或无病毒。我们可能随时调整、暂停或停止部分功能，且不另行单独通知。"
				},
				"copyright": {
					"title": "内容版权",
					"body": "你需对上传的图片拥有合法权利或获得充分授权。因上传或使用侵权、违规内容而产生的责任由你自行承担，edit-photo 不对用户内容承担责任。"
				}
			},
			"actions": {
				"backToTool": "返回免费抠图",
				"askContact": "联系我们"
			},
			"updated": "更新日期：2026 年 8 月 5 日"
		},
		tool: {
			"hero": {
				"eyebrow": "免费在线 AI 抠图工具",
				"titlePrefix": "AI 商品图抠图，",
				"titleHighlight": "一键去除背景",
				"descPrefix": "上传图片，AI 自动移除背景。",
				"descHighlight": "本地处理",
				"descSuffix": "，无需注册，直接下载透明 PNG。"
			},
			"trust": {
				"local": "✓ 浏览器本地处理",
				"originalSize": "✓ 原图尺寸导出",
				"noReg": "✓ 无需注册"
			},
			"nav": {
				"home": "首页",
				"howItWorks": "使用说明",
				"batch": "批量处理",
				"pro": "专业版",
				"contact": "联系我们",
				"pill": "本地 AI · 免费"
			},
			"upload": {
				"stepKicker": "在线工具 / 单张抠图",
				"title": "上传商品图片",
				"privacyNote": "图片不会上传",
				"dropTitle": "拖一张商品图到这里",
				"dropHint": "或点击选择、直接粘贴截图",
				"select": "选择商品图片",
				"formatHint": "支持 JPG / PNG / WebP · 最大 12MB",
				"selectLabel": "选择商品图片",
				"originalAlt": "待处理的商品原图"
			},
			"status": {
				"preparing": "准备图片",
			"loadingModel": "正在加载本地 AI 模型",
			"cleaning": "AI 正在净化边缘与背景杂点",
			"modelDownloaded": "模型下载完成，正在启动本地 AI",
			"modelDownloading": "首次使用，正在下载 AI 模型（约 66MB）",
			"runtimePreparing": "正在准备本地运行组件",
			"decoding": "正在读取并缩放商品图片",
			"inference": "AI 正在识别商品主体与边缘",
			"masking": "正在生成透明边缘",
			"encoding": "正在生成透明 PNG",
			"modelPreparing": "正在准备本地 AI 模型",
				"firstInitHint": "首次初始化可能需要 1–2 分钟，请继续保持页面打开。",
				"processingHint": "请保持页面打开，图片始终留在你的设备上。",
				"elapsed": "已等待",
				"seconds": "秒",
				"minutes": "分",
				"secondsUnit": "秒"
			},
			"result": {
				"original": "原图",
				"transparent": "透明底",
				"downloadPng": "下载 PNG",
				"originalAlt": "商品原图",
				"removedBgAlt": "已经移除背景的商品图",
				"transparentAlt": "透明背景处理结果",
				"compareAlt": "用于对比的商品原图",
				"compareSliderLabel": "原图与透明图对比位置 {position}%"
			},
			"view": {
				"sideBySide": "并排查看",
				"compare": "滑动对比",
				"drag": "拖动图片",
				"dragging": "正在拖动",
				"zoomHint": "查看细节",
				"zoomDragHint": "拖动查看细节",
				"zoomIn": "＋ 放大",
				"zoomOut": "− 缩小",
				"zoomControlsLabel": "图片缩放控制",
				"viewModeLabel": "图片查看模式",
				"currentZoom": "当前缩放 {zoom}%，点击恢复原始比例"
			},
			"cleanup": {
				"label": "边缘净化",
				"standard": "标准",
				"strong": "强力去杂",
				"shadow": "保留阴影",
				"reprocessing": "正在重新净化…",
				"standardHint": "适合大多数商品图片",
				"strongHint": "适合复杂纹理与地面杂点",
				"shadowHint": "适合需要自然落地感的商品",
				"manualHint": "边缘还有杂点或缺口？",
				"manualDesc": "用擦除与恢复画笔做最后修正，支持撤销。",
				"manualButton": "手动修边",
				"controlsLabel": "抠图净化强度"
			},
			"product": {
				"stepKicker": "02 / 电商成品图",
				"title": "一键生成平台白底主图",
				"bgColor": "背景颜色",
				"size": "商品大小",
				"posX": "左右位置",
				"posY": "上下位置",
				"shadow": "添加自然阴影",
				"downloadTransparent": "下载透明 PNG",
				"downloadWhite": "下载白底主图",
				"generating": "正在生成…",
				"again": "再处理一张",
				"composerLabel": "电商白底主图",
				"previewLabel": "白底主图预览",
				"previewAlt": "商品主图预览",
				"platformLabel": "选择电商平台",
				"customColorLabel": "自定义背景颜色",
				"selectColorLabel": "选择背景色 {color}"
			},
			"platforms": {
			"amazon": "Amazon 主图",
			"amazonShort": "Amazon",
			"taobao": "淘宝主图",
			"taobaoShort": "淘宝",
			"pinduoduo": "拼多多主图",
			"pinduoduoShort": "拼多多",
			"douyin": "抖音小店主图",
			"douyinShort": "抖音小店",
			"shopify": "Shopify 主图",
				"shopifyShort": "Shopify",
				"ebay": "eBay 主图",
				"ebayShort": "eBay"
			},
			"feedback": {
				"label": "抠图质量反馈",
				"thanks": "谢谢反馈，我们会用它继续优化商品图效果。",
				"title": "这张抠图能直接使用吗？",
				"hint": "反馈不包含你的图片",
				"satisfied": "满意",
				"unsatisfied": "不满意",
				"submit": "提交问题",
				"issues": [
					"有杂点",
					"边缘缺失",
					"阴影错误",
					"透明物体",
					"主体识别错误"
				]
			},
			"error": {
				"title": "这次没处理成功",
				"select": "重新选择",
				"retry": "重试处理",
				"reload": "刷新页面重试",
				"invalidType": "请选择 JPG、PNG 或 WebP 图片",
				"tooLarge": "图片不能超过 12MB，请压缩后再试",
				"timeout": "本地 AI 启动超过 2 分钟，浏览器运行环境可能已卡住。请刷新页面后重新处理。",
				"outOfMemory": "设备可用内存不足。请关闭其他页面，或换一张尺寸更小的图片后重试。",
				"modelNotReady": "本地模型没有加载完成。诊断版本：{version}；诊断码：{code}。请点击重试。"
			},
			"steps": {
				"label": "使用说明",
				"step1Title": "3 步",
				"step1Desc": "上传 → 自动抠图 → 下载",
				"step2Title": "0 上传",
				"step2Desc": "处理过程只发生在本地",
				"step3Title": "1 张起",
				"step3Desc": "先免费验证真实商品图"
			},
			"cta": {
				"eyebrow": "接下来要做的事",
				"title": "不是多一个工具，是少一堆重复劳动。",
				"batchBadge": "体验版已开放",
				"batchTitle": "批量商品白底图",
				"batchDesc": "一次选择多张商品图，自动排队抠图，完成后打包下载透明 PNG。",
				"batchLink": "试试批量处理 →"
			},
			"footer": {
				"copyright": "© 2026 edit-photo",
				"guide": "使用指南",
				"pricing": "专业版方案",
				"privacy": "隐私说明",
				"contact": "联系我们",
				"disclaimer": "免责声明",
				"clearCache": "清除模型缓存",
				"cacheCleared": "缓存已清除"
			},
			"download": {
				"transparentSuffix": "-透明底.png",
				"whiteSuffix": "-白底主图.png",
				"defaultName": "product"
			},
			"brand": {
				"name": "edit-photo",
				"homeLabel": "edit-photo 首页"
			}
		},
		maskEditor: {
			"stepKicker": "修边工作台",
			"title": "擦掉杂点，恢复缺失边缘",
			"close": "关闭手动修边",
			"canvasLabel": "手动修边画布",
			"hdFail": "高清画布准备失败，请关闭后重试",
			"hdPreparing": "正在准备高清画布…",
			"toolsLabel": "修边工具",
			"erase": "擦除杂点",
			"restore": "恢复边缘",
			"brush": "画笔",
			"zoomLabel": "画布缩放",
			"zoomIn": "放大画布",
			"zoomOut": "缩小画布",
			"zoomReset": "重置缩放",
			"panHint": "按住 Alt 可拖动图片",
			"undoTitle": "可连续撤销，直到恢复进入修边时的原始状态",
			"undo": "撤销上一步",
			"resetTitle": "丢弃全部手动修改，一键还原到进入修边前的原始状态",
			"resetAll": "还原全部",
			"cancel": "取消",
			"apply": "应用修边",
			"saving": "正在保存…"
		},
		admin: { "login": {
			"eyebrow": "管理员专用",
			"title": "登录管理后台",
			"description": "验证管理员身份后，可查看注册用户并管理账户状态与套餐。",
			"email": "管理员账户",
			"password": "管理员密码",
			"passwordPlaceholder": "请输入管理员账户密码",
			"submit": "登录用户管理后台",
			"submitting": "正在验证…",
			"terms": "此入口仅供授权管理员使用，连续输错将触发临时登录限制。",
			"errors": {
				"INVALID_CREDENTIALS": "管理员密码不正确。",
				"RATE_LIMITED": "尝试次数过多，请稍后再试。",
				"ACCOUNT_DISABLED": "管理员账户已停用，请检查用户状态。",
				"default": "登录没有完成，请稍后重试。",
				"network": "网络暂时不可用，请稍后重试。"
			}
		} },
		blog: /* @__PURE__ */ JSON.parse("{\"title\":\"使用指南与电商图片知识\",\"description\":\"电商商品图拍摄技巧、透明背景 PNG 知识、各平台主图规范——edit-photo为你整理实用的图片处理指南。\",\"eyebrow\":\"使用指南\",\"title_main\":\"电商图片知识库\",\"description_main\":\"从拍摄到上传，从抠图到导出——这里整理了电商卖家在做商品图时最常遇到的问题和实用技巧。\",\"articles\":{\"product-photo-tips\":{\"tag\":\"拍摄技巧\",\"title\":\"电商商品图拍摄技巧：让抠图更干净的 6 个要点\",\"excerpt\":\"好的商品图是抠图效果的基础。本文从光线、背景、角度、构图等方面，教你拍出更容易处理的商品照片。\",\"date\":\"2026-07-31\"},\"transparent-png-guide\":{\"tag\":\"基础知识\",\"title\":\"透明背景 PNG 完全指南：电商卖家需要知道的一切\",\"excerpt\":\"什么是透明背景 PNG？为什么电商平台需要它？如何制作？本文用通俗的语言帮你搞懂这些概念。\",\"date\":\"2026-07-31\"},\"ecommerce-image-specs\":{\"tag\":\"平台规范\",\"title\":\"各大电商平台主图规范汇总：尺寸、比例与白底要求\",\"excerpt\":\"淘宝、京东、拼多多、亚马逊——不同平台对商品主图的要求各不相同。本文帮你一次性梳理清楚。\",\"date\":\"2026-07-31\"},\"ai-vs-traditional-cutout\":{\"tag\":\"技术对比\",\"title\":\"AI 抠图 vs 传统抠图：为什么浏览器端抠图是未来\",\"excerpt\":\"从 PS 手动到在线网站再到浏览器 AI，各种抠图方式在速度、精度、成本、隐私四个维度的全面对比。\",\"date\":\"2026-08-01\"},\"white-background-tutorial\":{\"tag\":\"实操教程\",\"title\":\"电商主图白底图制作完整教程：从拍摄到上架\",\"excerpt\":\"手把手教你制作符合淘宝、京东、亚马逊等平台标准的商品白底图，包含常见问题解决方案。\",\"date\":\"2026-08-02\"},\"batch-product-photo-tips\":{\"tag\":\"效率技巧\",\"title\":\"批量处理商品图的 5 个高效技巧：几小时变几分钟\",\"excerpt\":\"分享拍摄标准化、批量抠图、平台预设、处理流水线等实用技巧，大幅提升商品图处理效率。\",\"date\":\"2026-08-03\"},\"remove-background-free\":{\"tag\":\"工具对比\",\"title\":\"免费在线抠图怎么选？6 款主流工具真实对比与避坑指南\",\"excerpt\":\"从精度、隐私、批量能力到导出格式，横向对比主流免费在线抠图工具，帮你少走弯路。\",\"date\":\"2026-08-04\"},\"png-vs-jpg\":{\"tag\":\"格式指南\",\"title\":\"电商图片用 PNG 还是 JPG？一张表说清怎么选\",\"excerpt\":\"透明背景必须用 PNG，照片类主图 JPG 更省空间。用对比表讲清两种格式在电商场景下的取舍。\",\"date\":\"2026-08-04\"},\"clothing-photo\":{\"tag\":\"服装电商\",\"title\":\"服装鞋包商品图：拍摄、抠图、白底一条龙实操\",\"excerpt\":\"针对服装、鞋、包类商品，给出从布光拍摄到 AI 抠图再到白底合成的完整流程与常见坑。\",\"date\":\"2026-08-04\"},\"conversion-tips\":{\"tag\":\"转化优化\",\"title\":\"商品主图优化：7 个提升点击转化的实操技巧\",\"excerpt\":\"主图决定第一印象。从构图、留白、边缘处理到场景图，7 个可立刻上手的优化技巧。\",\"date\":\"2026-08-04\"},\"ai-background-remover\":{\"tag\":\"AI抠图\",\"title\":\"AI抠图工具哪个好？2026 年 6 款主流工具横向测评\",\"excerpt\":\"从精度、隐私、价格维度横向测评 6 款主流 AI 抠图工具，帮你选对不掉坑。\",\"date\":\"2026-08-04\"},\"ai-image-upscaler\":{\"tag\":\"AI放大\",\"title\":\"AI图片放大工具推荐：无损放大商品图的 5 个选择\",\"excerpt\":\"推荐 5 个 AI 图片放大（超分辨率）工具，小图变清晰，商品图不再糊。\",\"date\":\"2026-08-04\"},\"ai-id-photo\":{\"tag\":\"AI证件照\",\"title\":\"AI证件照制作：一键换底色换尺寸，在家就能拍\",\"excerpt\":\"手机拍照就能生成合规证件照，一键换红蓝白底、按标准尺寸裁剪。\",\"date\":\"2026-08-04\"},\"ai-watermark-remover\":{\"tag\":\"AI去水印\",\"title\":\"AI去水印工具哪个好？一键清除图片水印实测\",\"excerpt\":\"实测主流 AI 去水印工具，一键清除图片水印，并提醒版权边界。\",\"date\":\"2026-08-04\"},\"ai-old-photo-restoration\":{\"tag\":\"老照片修复\",\"title\":\"AI老照片修复工具盘点：让旧照片清晰如新\",\"excerpt\":\"盘点 AI 老照片修复工具，降噪、上色、补划痕，让旧照片重现清晰。\",\"date\":\"2026-08-04\"},\"ai-product-background\":{\"tag\":\"背景替换\",\"title\":\"AI商品图背景替换：白底与场景图一键生成\",\"excerpt\":\"用 AI 一键换白底或生成场景图，电商商品图背景替换效率翻倍。\",\"date\":\"2026-08-04\"},\"ai-image-compressor\":{\"tag\":\"图片压缩\",\"title\":\"AI图片压缩工具推荐：体积减半画质不变\",\"excerpt\":\"推荐 AI 图片压缩工具，肉眼无差减小体积，提升网页加载与转化。\",\"date\":\"2026-08-04\"},\"ai-art-generator\":{\"tag\":\"AI绘画\",\"title\":\"AI绘画工具盘点：2026 年 10 款主流 AI 生图软件\",\"excerpt\":\"2026 年 10 款主流 AI 绘画工具分类盘点，附选型与商用授权提醒。\",\"date\":\"2026-08-04\"},\"ai-ecommerce-main-image\":{\"tag\":\"电商主图\",\"title\":\"AI电商主图生成：10 秒做出高点击爆款主图\",\"excerpt\":\"用 AI 模板 10 秒生成专业电商主图，提升点击率，省下拍摄时间。\",\"date\":\"2026-08-04\"},\"free-ai-tools-roundup\":{\"tag\":\"工具合集\",\"title\":\"免费AI工具合集：电商卖家必备的 12 个神器\",\"excerpt\":\"整理 12 个免费 AI 工具，覆盖抠图、设计、文案，小卖家也能起步。\",\"date\":\"2026-08-04\"},\"ai-scene-composite\":{\"tag\":\"场景合成\",\"title\":\"AI 换背景合成场景图：商品图一键换场景变大片\",\"excerpt\":\"把抠好的商品合成到场景图里，营造使用氛围。从场景选择、光影匹配到投影与透视，5 步做出自然高级的场景图。\",\"date\":\"2026-08-04\"},\"best-free-ai-cutout\":{\"tag\":\"工具横评\",\"title\":\"2026年5款免费AI抠图工具横评：谁才是真的免费又好用？\",\"excerpt\":\"号称免费的工具，暗藏水印、低清、限次三陷阱。实测5类方案，教你用免费额度拿到干净高清图。\",\"date\":\"2026-08-05\"},\"ai-bg-psychology\":{\"tag\":\"视觉心理学\",\"title\":\"AI换背景为什么让你更专业？视觉心理学的3个真相\",\"excerpt\":\"同一个人换张背景，专业感差一倍。首因效应、色彩情绪、留白——3条心理学帮你用AI一键变专业。\",\"date\":\"2026-08-05\"},\"ai-vs-manual-editing\":{\"tag\":\"效率提升\",\"title\":\"还在手动抠图？6个AI图片工具让你5分钟出片\",\"excerpt\":\"手动抠一张20分钟，AI 3秒。算一笔时间账、质量账、心智账，看AI图片工具如何帮你早下班。\",\"date\":\"2026-08-05\"},\"ai-id-photo-bg\":{\"tag\":\"证件照\",\"title\":\"AI证件照换底色全攻略：在家3分钟搞定，立省30元\",\"excerpt\":\"红蓝白底怎么换、哪些坑别踩、打印尺寸怎么选。手把手教你用AI在家换证件照底色。\",\"date\":\"2026-08-05\"},\"old-photo-emotion\":{\"tag\":\"情感价值\",\"title\":\"老照片修复AI工具：让记忆变清晰，到底值不值？\",\"excerpt\":\"一张模糊老照片看清了外婆的脸。聊聊AI老照片修复的情感价值，以及怎么修才得体。\",\"date\":\"2026-08-05\"},\"ecommerce-ctr-ai\":{\"tag\":\"电商增长\",\"title\":\"电商卖家必看：7个AI工具让产品图点击率提升200%\",\"excerpt\":\"主图决定点击，点击决定成交。7个AI图片工具方向加A/B测试，把产品图做成会卖货的图。\",\"date\":\"2026-08-05\"},\"ai-poster-design\":{\"tag\":\"海报设计\",\"title\":\"零基础也能做海报？4个AI海报设计工具实测\",\"excerpt\":\"不会PS也能10分钟出图。实测4类AI海报工具，附留白、对比、对齐三原则，小白也能做高级图。\",\"date\":\"2026-08-05\"},\"underrated-ai-tools\":{\"tag\":\"工具合集\",\"title\":\"10个被严重低估的AI工具，第6个太惊艳\",\"excerpt\":\"不炫技却真香的10个AI工具：抠图、去水印、压缩、上色、换背景……第6个一键换背景最惊艳。\",\"date\":\"2026-08-05\"},\"ai-replace-designers\":{\"tag\":\"行业观察\",\"title\":\"AI工具会取代设计师吗？2026年最诚实的答案\",\"excerpt\":\"AI取代重复执行，不取代会思考的设计师。拆解哪些被取代、哪些不会，给从业者3点建议。\",\"date\":\"2026-08-05\"},\"ai-tools-leave-early\":{\"tag\":\"工作方法\",\"title\":\"用AI工具的人，为什么比同事早下班2小时？\",\"excerpt\":\"同样8小时，用AI的人6点走。自动化机械活、修图提速、把时间还给思考——早下班的底层逻辑。\",\"date\":\"2026-08-05\"},\"remove-background-online\":{\"tag\":\"背景移除\",\"title\":\"在线一键去除照片背景\",\"excerpt\":\"想在线去除照片背景又不想装软件？用 edit-photo 拖入图片，几秒得到干净抠图，全程浏览器本地处理。\",\"date\":\"2026-08-05\"},\"transparent-png-online\":{\"tag\":\"透明 PNG\",\"title\":\"在线几秒做出透明背景 PNG\",\"excerpt\":\"做 logo、商品图或表情包需要透明 PNG？用 edit-photo 在线几秒做出，不用 Photoshop。\",\"date\":\"2026-08-05\"},\"batch-remove-background-online\":{\"tag\":\"批量抠图\",\"title\":\"批量去除多张照片背景\",\"excerpt\":\"一堆照片都要去背景？用 edit-photo 批量工具一次处理多张、打包下载，告别一张张抠。\",\"date\":\"2026-08-05\"},\"upscale-photo-online\":{\"tag\":\"照片放大\",\"title\":\"在线一键放大模糊照片，秒变高清\",\"excerpt\":\"拍糊了、截图太小？用 edit-photo 在线一键放大照片，几秒把模糊变清晰，不用装软件。\",\"date\":\"2026-08-05\"},\"remove-watermark-online\":{\"tag\":\"去水印\",\"title\":\"在线去除照片水印，几秒干净\",\"excerpt\":\"下载的图带水印、自己照片被盖章？用 edit-photo 在线去除水印，框一下点一下，干净无需 PS。\",\"date\":\"2026-08-05\"},\"compress-image-online\":{\"tag\":\"图片压缩\",\"title\":\"在线压缩图片体积，画质几乎不损\",\"excerpt\":\"图片太大传不动？用 edit-photo 在线压缩图片，画质几乎看不出损，体积却小一大截。\",\"date\":\"2026-08-05\"},\"colorize-photo-online\":{\"tag\":\"照片上色\",\"title\":\"在线给黑白老照片上色，一键唤醒回忆\",\"excerpt\":\"泛黄黑白老照片想看看彩色？用 edit-photo 在线给黑白照片上色，一键自然上色，不用会修图。\",\"date\":\"2026-08-05\"},\"id-photo-change-outfit-online\":{\"tag\":\"证件照换装\",\"title\":\"在线换证件照服装，居家搞定正装照\",\"excerpt\":\"证件照要正装却只有T恤？用 edit-photo 在线换证件照服装，居家改成正式感，还能顺带换底色。\",\"date\":\"2026-08-05\"},\"case-etsy-seller\":{\"tag\":\"使用案例\",\"title\":\"案例：手作卖家靠 edit-photo 一周做出 300 张商品图\",\"excerpt\":\"手作卖家小 A 用 edit-photo 批量去背、放大、压缩，一周跑完 300 张白底商品图，转化也涨了。\",\"date\":\"2026-08-05\"},\"case-real-estate\":{\"tag\":\"使用案例\",\"title\":\"案例：房产中介用 edit-photo 让房源图点击率翻倍\",\"excerpt\":\"中介老周用 edit-photo 去背、换景、提清晰度，把房源图翻新，平均点击率翻倍、带看变多。\",\"date\":\"2026-08-05\"},\"case-content-creator\":{\"tag\":\"使用案例\",\"title\":\"案例：自媒体博主用 edit-photo 日更不熬夜\",\"excerpt\":\"博主阿杰用 edit-photo 批量去水印、放大、压缩，把配图做成流水线，日更还能十二点前睡。\",\"date\":\"2026-08-05\"},\"ai-tools-thinking-trap\":{\"tag\":\"认知心理\",\"title\":\"AI 工具正在偷走你的思考力？心理学家的 5 个警告\",\"excerpt\":\"便利背后藏着认知陷阱。本文从心理学角度拆解 AI 工具如何让人依赖、钝化判断力，并给出自保方法。\",\"date\":\"2026-08-06\"},\"ai-hallucination-explained\":{\"tag\":\"AI 科普\",\"title\":\"AI 为什么会胡说八道？一文看懂大模型幻觉的成因\",\"excerpt\":\"幻觉不是 bug，而是语言模型的底层机制。读懂它，你才不会被 AI 的自信误导。\",\"date\":\"2026-08-06\"},\"free-ai-tools-hidden-cost\":{\"tag\":\"工具避坑\",\"title\":\"免费 AI 工具真的免费吗？揭秘 5 个隐性成本\",\"excerpt\":\"免费往往是最贵的。拆解免费 AI 工具在隐私、水印、额度、质量上的隐性代价。\",\"date\":\"2026-08-06\"},\"prompt-psychology\":{\"tag\":\"提示词\",\"title\":\"会写提示词的人更值钱：提示词里的 5 个心理学原理\",\"excerpt\":\"提示词不是咒语，而是沟通。用心理学原理写出让 AI 更懂你的指令。\",\"date\":\"2026-08-06\"},\"ai-take-your-job-myth\":{\"tag\":\"行业观点\",\"title\":\"AI 会抢走你的工作吗？数据告诉你三个真相\",\"excerpt\":\"恐慌来自未知。用真实数据拆解 AI 对就业的影响，焦虑的人和被淘汰的人不是同一批。\",\"date\":\"2026-08-06\"},\"ai-content-detection-seo\":{\"tag\":\"SEO 与内容\",\"title\":\"你的文章被 AI 写了吗？搜索引擎如何识别 AI 内容\",\"excerpt\":\"AI 内容不等于低质，但算法在进化。看懂检测逻辑，让内容既高效又安全。\",\"date\":\"2026-08-06\"},\"ai-productivity-paradox\":{\"tag\":\"效率心理\",\"title\":\"为什么用了 AI 反而更忙了？效率工具的 3 个反直觉真相\",\"excerpt\":\"工具本为省时，却让人陷入无限产出。从心理学看效率悖论的成因与破解。\",\"date\":\"2026-08-06\"},\"ai-tools-you-actually-need\":{\"tag\":\"工具精选\",\"title\":\"300 个 AI 工具，你真正需要的只有这 8 个\",\"excerpt\":\"工具过载让人焦虑。精选 8 个覆盖日常创作与办公的 AI 工具，少而精。\",\"date\":\"2026-08-06\"},\"ai-creativity-engine\":{\"tag\":\"创造力\",\"title\":\"AI 不是创作力杀手，而是灵感引擎：突破脑暴瓶颈\",\"excerpt\":\"担心 AI 替代灵感？换个用法，它能成为你最不知疲倦的共创伙伴。\",\"date\":\"2026-08-06\"},\"ai-privacy-safety\":{\"tag\":\"隐私安全\",\"title\":\"把照片喂给 AI 安全吗？一张图看懂隐私风险与自保\",\"excerpt\":\"上传即授权？认清 AI 工具的隐私边界，学会用本地处理保护你的图片。\",\"date\":\"2026-08-06\"}},\"readMore\":\"阅读全文\",\"backToBlog\":\"返回指南列表\",\"relatedTitle\":\"相关文章\"}"),
		metadata: {
			"home": {
				"title": "免费 AI 抠图工具：商品图片一键去背景 | edit-photo",
				"description": "免费在浏览器中去除商品图片背景，生成透明 PNG 和电商平台白底主图。图片不上传，无需注册。"
			},
			"batch": {
				"title": "批量抠图",
				"description": "多张商品图片在浏览器本地自动排队抠图，打包下载透明 PNG。"
			},
			"pricing": {
				"title": "专业版方案",
				"description": "edit-photo免费和专业版方案。"
			},
			"auth": {
				"title": "注册登录",
				"description": "注册或登录账户，管理你的产品权益。"
			},
			"account": {
				"title": "我的账户",
				"description": "管理你的edit-photo账户与专业版申请。"
			},
			"contact": {
				"title": "联系我们",
				"description": "通过微信或电子邮件联系edit-photo。"
			},
			"privacy": {
				"title": "隐私说明",
				"description": "了解edit-photo如何在浏览器本地处理图片和保护用户隐私。"
			},
			"blog": {
				"title": "使用指南与电商图片知识",
				"description": "电商商品图拍摄技巧、透明背景 PNG 知识、各平台主图规范——edit-photo为你整理实用的图片处理指南。"
			}
		}
	}
} as const; 
