-- =============================================================
-- DR NAEEM Eye Laser & Retina Center Call Assistant
-- Seed Data - Initial content from backup
-- Run this AFTER schema.sql in Supabase SQL Editor
-- =============================================================

-- =============================================================
-- CATEGORIES
-- =============================================================
INSERT INTO public.categories (id, name, created_at, updated_at) VALUES
  ('smile-pro', 'SMILE Pro', NOW(), NOW()),
  ('general', 'General Information', NOW(), NOW()),
  ('squint', 'Squint (Strabismus)', NOW(), NOW()),
  ('phaco-iol', 'Phaco IOL', NOW(), NOW()),
  ('cxl', 'CXL', NOW(), NOW()),
  ('glaucoma', 'Glaucoma', NOW(), NOW()),
  ('allergy', 'Allergy', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- =============================================================
-- QUESTIONS
-- =============================================================

-- SMILE Pro Questions
INSERT INTO public.questions (id, category_id, question, answer, keywords, created_at, updated_at) VALUES
('smile-pro-ur-1', 'smile-pro',
 'SMILE اور SMILE Pro میں کیا فرق ہے؟',
 'SMILE میں لیزر کے ذریعے نظر کی اصلاح کی جاتی ہے اور لیزر کا عمل تقریباً 25 سے 30 سیکنڈ میں مکمل ہو سکتا ہے۔ جبکہ SMILE Pro میں جدید اور زیادہ تیز رفتار لیزر استعمال ہوتا ہے، جو فی آنکھ 9 سیکنڈ سے بھی کم وقت میں لیزر کا عمل مکمل کر سکتا ہے。',
 ARRAY['What is the difference between SMILE and SMILE Pro?'],
 '2026-08-16T12:41:38.167Z', '2026-08-17T16:44:59.270Z'),

('smile-pro-ur-2', 'smile-pro',
 'ریفریکٹیو سرجری کتنے عرصے تک رہتی ہے؟ کیا کوئی مخصوص مدت ہے جس تک یہ مؤثر رہتی ہے، یا اس کے نتائج زندگی بھر رہ سکتے ہیں؟',
 'لیزر کے ذریعے کی جانے والی کارنیا کی اصلاح طویل مدتی ہوتی ہے، تاہم عمر بڑھنے کے ساتھ آنکھوں میں قدرتی تبدیلیاں آ سکتی ہیں اور نظر بھی تبدیل ہو سکتی ہے۔',
 ARRAY['How long does refractive surgery last? Is there a specific duration for which it remains effective, or can the results last a lifetime?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('smile-pro-ur-3', 'smile-pro',
 'صرف لیزر شعاعوں سے نظر بہتر ہونا کیسے ممکن ہے؟',
 'لیزر آنکھ کے سامنے موجود کارنیا کی شکل کو انتہائی درستگی سے تبدیل کرتا ہے، تاکہ روشنی صحیح طریقے سے فوکس ہو سکے۔ اس طرح دھندلا پن کم ہوتا ہے اور نظر زیادہ واضح ہو جاتی ہے۔',
 ARRAY['How is it possible for vision to improve using only laser rays?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('smile-pro-ur-4', 'smile-pro',
 'کیا SMILE Pro، LASIK سے مختلف ہے؟',
 'جی ہاں۔ SMILE Pro میں کارنیا پر ایک چھوٹے سے شگاف کے ذریعے لیزر سے تیار کیا گیا باریک ٹشو نکالا جاتا ہے، جبکہ LASIK میں کارنیا کا فلیپ بنایا جاتا ہے، پھر فلیپ کے نیچے لیزر لگایا جاتا ہے. مناسب طریقہ مریض کی آنکھوں کی حالت اور پیمائش کے مطابق طے کیا جاتا ہے۔',
 ARRAY['Is SMILE Pro different from LASIK?'],
 '2026-08-16T12:41:38.167Z', '2026-08-18T11:13:37.333Z'),

('smile-pro-ur-5', 'smile-pro',
 'کیا SMILE Pro میں کارنیا کا فلیپ بنایا جاتا ہے؟',
 'نہیں۔ LASIK کے برعکس، SMILE Pro ایک فلیپ لیس طریقہ ہے جس میں کارنیا پر ایک چھوٹا سا شگاف بنایا جاتا ہے۔',
 ARRAY['Does SMILE Pro leave a flap?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('smile-pro-ur-6', 'smile-pro',
 'SMILE Pro سے پہلے کون سے ٹیسٹ کیے جاتے ہیں؟',
 'معائنے میں آنکھوں کا نمبر، کارنیا کی موٹائی اور شکل، آنکھوں کی نمی اور مجموعی صحت کی جانچ شامل ہو سکتی ہے۔ یہ ٹیسٹ سرجن کو مریض کی اہلیت جانچنے اور سرجری کی منصوبہ بندی میں مدد دیتے ہیں۔',
 ARRAY['What tests are done before SMILE Pro?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('smile-pro-ur-7', 'smile-pro',
 'کیا SMILE Pro نزدیک کی نظر کی کمزوری (Myopia) کو درست کر سکتا ہے؟',
 'SMILE Pro صرف دور کی نظر کی کمزوری کو درست کرنے کے لیے استعمال ہوتا ہے۔',
 ARRAY['Can SMILE Pro correct short sightedness?'],
 '2026-08-16T12:41:38.167Z', '2026-08-18T11:19:11.130Z'),

('q-msxgwuku-275', 'smile-pro',
 'اگر میرا چشمے کا نمبر بہت زیادہ ہو تو کیا پھر بھی Pro SMILE ہو سکتا ہے؟',
 'جی، ہو سکتا ہے۔ یہ آپ کے نمبر اور کارنیا کی موٹائی پر ڈیپینڈ کرتا ہے۔',
 ARRAY['If my glasses prescription is very high', 'can I still have Pro SMILE?'],
 '2026-08-17T16:48:25.804Z', '2026-08-17T16:48:25.804Z'),

('q-msxi24bm-86', 'smile-pro',
 'Pro SMILE کے بعد موبائل کتنے دن بعد استعمال کر سکتے ہیں؟',
 'موبائل مکمل طور پر منع نہیں ہوتا، لیکن پہلے دن آنکھوں کو آرام دینا بہتر ہے۔ اس کے بعد موبائل مختصر وقت کے لیے استعمال کریں، بار بار پلکیں جھپکائیں، اور اگر آنکھوں میں خشکی یا تھکن ہو تو اسکرین ٹائم کم کریں۔',
 ARRAY['How soon can I use my mobile after Pro SMILE?'],
 '2026-08-17T17:20:31.329Z', '2026-08-17T17:20:31.329Z'),

('q-msxiayhy-88', 'smile-pro',
 'کیا Pro SMILE ہر چشمہ پہننے والے شخص کے لیے مناسب ہوتا ہے؟',
 'نہیں۔ ہر شخص candidate نہیں ہوتا۔ عمر،  stable prescription، کارنیا کی dry eye ،thickness اور
دوسری eye conditions  دیکھنے کے بعد eligibility طے کی جاتی ہے۔',
 ARRAY['Is Pro SMILE suitable for everyone who wears glasses?'],
 '2026-08-18T11:21:21.592Z', '2026-08-18T11:21:21.592Z'),

('q-msxijcwy-259', 'smile-pro',
 'Pro SMILE کے بعد آنکھوں کی حفاظت کے لیے کن باتوں کا خیال رکھنا پڑتا ہے؟',
 'آنکھیں نہ رگڑیں، prescribed drops  وقت پر استعمال کریں، دھول اور سے بچیں، پانی کا استعمال نہ کریں اور follow up  نہ Miss کریں۔
سرجن کی ہدایات کے مطابق آنکھوں کو نہ رگڑیں، کاسمیٹکس اور میک اپ استعمال نہ کریں، پانی نہ لگنے دیں، کھانا نہ پکائیں، اور  کوئی بھی بھاری کام نہ کریں۔',
 ARRAY['What precautions should I take to protect my eyes after Pro SMILE?'],
 '2026-08-18T11:31:49.051Z', '2026-08-18T11:31:49.051Z'),

('q-msxiluq8-180', 'smile-pro',
 'Pro SMILE کے بعد کتنی دیر میں صاف نظر آنا شروع ہو جاتی ہے؟',
 'اکثر مریضوں میں نظر پہلے ہی دن کافی بہتر محسوس ہونے لگتی ہے، لیکن مکمل clarity اور stability آنے میں کچھ دن یا
کبھی زیادہ وقت لگ سکتا ہے۔ ہر مریض کی recovery مختلف ہوتی ہے۔',
 ARRAY['How soon can I expect clear vision after Pro SMILE?'],
 '2026-08-17T17:35:52.016Z', '2026-08-17T17:35:52.016Z'),

('q-msye3vy0-945', 'smile-pro',
 'SMILE Pro کے بعد normal routine پر کتنی جلدی واپس آ سکتے ہیں؟',
 'Recovery عموماً کافی تیز ہوتی ہے اور بہت سے مریض جلد اپنے روزمرہ کے کام شروع کر لیتے ہیں۔ Doctor کی احتیاطی ہدایات follow کرنا ضروری ہے۔',
 ARRAY['How soon can I return to normal routine after SMILE Pro'],
 '2026-08-18T08:17:41.496Z', '2026-08-18T08:17:41.496Z'),

('q-msygygqa-864', 'smile-pro',
 'اگر آنکھوں میں الرجی رہتی ہو تو کیا SMILE Pro یا LASIK کروایا جا سکتا ہے؟',
 'جی، اکثر ممکن ہوتا ہے۔ پہلے الرجی کو قابو میں کرکے آنکھوں کا مکمل معائنہ کیا جاتا ہے',
 ARRAY['Can I have SMILE Pro or LASIK if I have eye allergies'],
 '2026-08-18T09:37:27.346Z', '2026-08-18T09:37:27.346Z'),

('q-msygzf72-65', 'smile-pro',
 'کیا SMILE Pro یا LASIK کروانے سے آنکھوں کی الرجی بھی ختم ہو جاتی ہے؟',
 'نہیں، یہ Surgery نظر کا نمبر درست کرتی ہے، الرجی کا علاج نہیں کرتی',
 ARRAY['Does SMILE Pro or LASIK cure eye allergies'],
 '2026-08-18T09:38:12.014Z', '2026-08-18T09:38:12.014Z')

ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  updated_at = EXCLUDED.updated_at;

-- Squint Questions
INSERT INTO public.questions (id, category_id, question, answer, keywords, created_at, updated_at) VALUES
('squint-1', 'squint',
 'بھینگے پن (Squint) کی سرجری کس عمر میں بہتر رہتی ہے؟',
 'بھینگے پن کی سرجری کسی بھی عمر میں کی جا سکتی ہے، لیکن بچوں میں بروقت علاج سے آنکھوں کی نظر بہتر طریقے سے نشوونما پا سکتی ہے',
 ARRAY['At what age is squint surgery best performed?'],
 '2026-08-17T16:58:48.799Z', '2026-08-17T16:58:48.799Z'),

('squint-2', 'squint',
 'اگر یہ خاندانی مسئلہ ہے تو کیا پھر بھی اس کا علاج ہو سکتا ہے؟',
 'جی ہاں، اگر بھینگا پن خاندان میں پایا جاتا ہو تو بھی اس کا علاج ممکن ہے۔ علاج میں عینک، آنکھوں کی مخصوص ورزشیں یا ضرورت کے مطابق سرجری شامل ہو سکتی ہے۔',
 ARRAY['If it is a genetic condition', 'can it still be treated?'],
 '2026-08-17T16:54:38.763Z', '2026-08-17T16:54:38.763Z'),

('squint-3', 'squint',
 'بھینگے پن (Squint) کی وجوہات کیا ہیں؟',
 'بھینگا پن اس وقت ہوتا ہے جب آنکھوں کے پٹھے صحیح طرح کام نہ کریں۔ اس کے علاوہ نظر کا نمبر درست نہ ہونے کی وجہ سے بھی یہ مسئلہ ہو سکتا ہے۔',
 ARRAY['What are the causes of squint?'],
 '2026-08-17T16:56:27.139Z', '2026-08-17T16:56:27.139Z'),

('squint-4', 'squint',
 'کیا بھینگا پن گہرائی اور فاصلے کا اندازہ لگانے میں مشکل پیدا کر سکتا ہے؟',
 'جی ہاں، بھینگے پن کی وجہ سے گہرائی اور فاصلے کا اندازہ متاثر ہو سکتا ہے۔ جب دونوں آنکھیں ایک سمت میں نہ ہوں تو فاصلے کا اندازہ لگانے میں مشکل ہو سکتی ہے۔',
 ARRAY['Can squint affect depth perception?'],
 '2026-08-17T17:01:58.981Z', '2026-08-17T17:01:58.981Z'),

('squint-5', 'squint',
 'کیا عینک بھینگے پن کو درست کر سکتی ہے؟',
 'کچھ مریضوں میں، خاص طور پر جب بھینگا پن نظر کے نمبر کی وجہ سے ہو، صحیح عینک سے آنکھوں کی سیدھ بہتر ہو سکتی ہے۔ تاہم، ہر قسم کے بھینگے پن کا علاج صرف عینک سے ممکن نہیں ہوتا۔',
 ARRAY['Can glasses correct squint?'],
 '2026-08-17T17:04:28.305Z', '2026-08-17T17:04:28.305Z'),

('q-msxgm9ex-930', 'squint',
 'میرے بچے کی ایک آنکھ کبھی کبھی ٹیڑھی ہو جاتی ہے، کیا یہ Squint ہے؟',
 'ہاں، یہ Intermittent Squint ہو سکتا ہے۔ بچے کا نظر کا ٹیسٹ کروا لیں اور اسے Observation میں رکھیں۔',
 ARRAY['My child''s one eye sometimes turns in or becomes misaligned. Could this be Squint?'],
 '2026-08-17T16:40:11.814Z', '2026-08-17T16:40:11.814Z'),

('q-msxiqtlr-875', 'squint',
 'اگر بچپن سے بھینگا پن ہو تو بڑے ہو کر بھی ٹھیک ہو سکتا ہے؟',
 'جی ہاں، بڑوں میں بھی alignment eye بہتر کرنے کے لیے treatment یا surgery ممکن ہے',
 ARRAY['Can squint that started in childhood still be treated when you''re an adult?'],
 '2026-08-17T17:39:43.838Z', '2026-08-17T17:39:43.838Z'),

('q-msxisy7t-853', 'squint',
 'Squint کا علاج نہ کروائیں تو کیا وقت کے ساتھ مسئلہ بڑھ سکتا ہے؟',
 'کچھ اقسام stable رہتی ہیں اور کچھ بڑھ سکتی ہیں۔ بچوں میں squint untreated سے eye lazy اور vision binocular
کے مسائل کا خطرہ ہو سکتا ہے، اس لیے assessment early اہم ہے۔',
 ARRAY['If squint is not treated', 'can it get worse over time?'],
 '2026-08-17T17:41:23.128Z', '2026-08-17T17:41:23.128Z'),

('q-msxiuwi5-747', 'squint',
 'بچے کی آنکھ صرف تھکن کے وقت ٹیڑھی ہوتی ہے، کیا یہ بھی مسئلہ ہے؟',
 'جی، squint intermittent اکثر تھکن، بیماری یا توجہ کم ہونے پر زیادہ نمایاں ہو سکتا ہے۔ ایسی صورت میں بھی eye
alignment اور vision کی جانچ ضروری ہے۔',
 ARRAY['My child''s eye only turns when they''re tired. Is that also a problem?'],
 '2026-08-17T17:42:54.221Z', '2026-08-17T17:42:54.221Z'),

('q-msxiwyit-574', 'squint',
 'کیا Squint کی وجہ سے ایک آنکھ کی نظر کمزور ہو سکتی ہے؟',
 'خاص طور پر بچوں میں ایسا ہو سکتا ہے۔ دماغ ٹیڑھی آنکھ کی تصویر کو ignore کرنا شروع کر دے تو amblyopia یعنی
eye lazy بن سکتی ہے۔',
 ARRAY['Can squint cause reduced vision in one eye?'],
 '2026-08-17T17:44:30.149Z', '2026-08-17T17:44:30.149Z'),

('q-msxizwse-17', 'squint',
 'اگر دونوں آنکھیں مختلف سمت میں جاتی ہوں تو اس کا بھی علاج ہو سکتا ہے؟',
 'جی ہاں۔ Squint کی مختلف اقسام کا علاج ممکن ہے، لیکن treatment اس کی vision ،angle ،type اور عمر کے مطابق
مختلف ہو سکتا ہے۔',
 ARRAY['Can it be treated if both eyes point in different directions?'],
 '2026-08-17T17:46:47.870Z', '2026-08-17T17:46:47.870Z'),

('q-msyd6y11-542', 'squint',
 'Squint surgery کے بعد آنکھیں بالکل نارمل ہو جاتی ہیں؟',
 'اکثر آنکھوں کی alignment کافی بہتر ہو جاتی ہے، لیکن ہر مریض کا result مختلف ہو سکتا ہے۔',
 ARRAY['Do the eyes become completely normal after squint surgery'],
 '2026-08-18T07:52:04.539Z', '2026-08-18T07:52:04.539Z'),

('q-msyd7x6u-790', 'squint',
 'Squint surgery کے بعد double vision بھی ختم ہو جاتا ہے',
 'بہت سے مریضوں میں double vision بہتر ہو جاتا ہے، لیکن یہ اس کی اصل وجہ پر depend کرتا ہے۔',
 ARRAY['Does double vision go away after squint surgery'],
 '2026-08-18T08:17:18.647Z', '2026-08-18T08:17:18.647Z'),

('q-msydb5gf-86', 'squint',
 'کیا بھینگا پن سرجری کے بعد دوبارہ آ سکتا ہے؟',
 'زیادہ تر مریضوں میں آپریشن کے بعد بھینگا پن اچھی طرح ٹھیک ہو جاتا ہے۔
صرف بہت کم مریضوں میں، خاص طور پر جب بھینگے پن کا زاویہ زیادہ ہو، دوسری سرجری کی ضرورت پڑ سکتی ہے۔',
 ARRAY['Can squint come back after surgery'],
 '2026-08-18T12:10:30.887Z', '2026-08-18T12:10:30.887Z'),

('q-msyddbe7-404', 'squint',
 'بھینگے پن کی سرجری کے بعد کتنے دن میں ٹھیک ہو جاتے ہیں؟',
 'بھینگا پن عموماً آپریشن کے فوراً بعد سیدھا ہو جاتا ہے، البتہ آنکھ کی لالی کچھ دن تک رہ سکتی ہے۔',
 ARRAY['How long does recovery take after squint surgery'],
 '2026-08-18T12:01:56.532Z', '2026-08-18T12:01:56.532Z'),

('q-msydsxh2-624', 'squint',
 'بھینگے پن کی سرجری کے بعد آنکھیں سیدھی ہو جاتی ہیں؟',
 'جی، زیادہ تر مریضوں میں آنکھوں کی سیدھ واضح طور پر بہتر ہو جاتی ہے۔ اچھے نتیجے کے لیے پہلے بھینگے پن کی قسم اور آنکھوں کا مکمل معائنہ ضروری ہوتا ہے۔',
 ARRAY['Do the eyes become straight after squint surgery'],
 '2026-08-18T08:09:10.262Z', '2026-08-18T08:09:10.262Z'),

('q-msygeruw-715', 'squint',
 'میرے بچے کی آنکھ صرف تصویروں میں ٹیڑھی لگتی ہے، کیا یہ بھینگا پن ہو سکتا ہے؟',
 'ضروری نہیں۔ بعض بچوں کی آنکھ تصویر میں ٹیڑھی لگتی ہے، لیکن صحیح پتہ مکمل معائنے سے چلتا ہے',
 ARRAY['My child''s eye only looks crossed in photographs. Could this be strabismus?'],
 '2026-08-18T09:22:08.648Z', '2026-08-18T09:22:08.648Z'),

('q-msygfp20-8', 'squint',
 'میرا بچہ دھوپ میں ایک آنکھ بند کر لیتا ہے، کیا یہ بھینگے پن کی نشانی ہے؟',
 'جی، بعض بچوں میں ایسا بھینگے پن کی وجہ سے ہو سکتا ہے، اس لیے آنکھوں کا معائنہ بہتر رہتا ہے',
 ARRAY['Why does my child close one eye in bright sunlight? Could it be a sign of strabismus?'],
 '2026-08-18T09:22:51.672Z', '2026-08-18T09:22:51.672Z')

ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  updated_at = EXCLUDED.updated_at;

-- Phaco IOL Questions
INSERT INTO public.questions (id, category_id, question, answer, keywords, created_at, updated_at) VALUES
('phaco-iol-1', 'phaco-iol',
 'Phaco اور ریفریکٹیو سرجری میں کیا فرق ہے؟',
 'Phaco میں موتیے کی وجہ سے دھندلا ہونے والے قدرتی لینز کو نکالا جاتا ہے، جبکہ ریفریکٹیو سرجری عام نظر کے نمبر کو کم یا درست کرنے کے لیے کی جاتی ہے، تاکہ عینک پر انحصار کم ہو سکے۔',
 ARRAY['What is the difference between Phaco and refractive surgery?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('phaco-iol-2', 'phaco-iol',
 'کیا Phaco سرجری کے دوران لینز لگانا ضروری ہے؟',
 'دھندلے قدرتی لینز کو نکالنے کے بعد عموماً اس کی جگہ ایک صاف مصنوعی لینز لگایا جاتا ہے۔ یہ مصنوعی لینز آنکھ کی فوکس کرنے کی صلاحیت کو بحال کرنے میں مدد دیتا ہے۔',
 ARRAY['Is it necessary to implant a lens during Phaco surgery?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('phaco-iol-3', 'phaco-iol',
 'کیا Phaco سرجری بغیر لینز لگائے کی جا سکتی ہے؟ اگر ہاں، تو اسے مکمل کرنے میں کتنا وقت لگے گا؟',
 'Phaco کا عمل تقریباً 10 سے 15 منٹ میں مکمل ہو سکتا ہے، لیکن اگر مصنوعی لینز نہ لگایا جائے تو آنکھ کی فوکس کرنے کی صلاحیت بہت کم ہو جائے گی۔ ایسی صورت میں واضح نظر کے لیے بہت موٹے نمبر کی عینک کی ضرورت پڑ سکتی ہے۔',
 ARRAY['Can Phaco surgery be performed without implanting a lens? If so, how long will it take to complete?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('phaco-iol-4', 'phaco-iol',
 'موتیے کی سرجری کب کروانے پر غور کرنا چاہیے؟',
 'عام طور پر اس وقت سرجری پر غور کیا جاتا ہے جب موتیا روزمرہ کے کاموں، جیسے پڑھنے، گاڑی چلانے، کام کرنے یا واضح طور پر دیکھنے میں رکاوٹ ڈالنے لگے۔',
 ARRAY['When should cataract surgery be considered?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('phaco-iol-5', 'phaco-iol',
 'کیا موتیے کا علاج آنکھوں کے قطروں سے کیا جا سکتا ہے؟',
 'آنکھوں کے قطرے بن چکے موتیے کو ختم نہیں کر سکتے۔ جب موتیا نظر کو نمایاں طور پر متاثر کرنے لگے تو اس کا حتمی علاج سرجری ہے۔',
 ARRAY['Can cataract be treated with eye drops?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('phaco-iol-6', 'phaco-iol',
 'کیا عمر رسیدہ مریضوں کی موتیے کی سرجری کی جا سکتی ہے؟',
 'صرف عمر کی بنیاد پر عموماً سرجری کا فیصلہ نہیں کیا جاتا۔ سرجری سے پہلے مریض کی عمومی صحت اور آنکھوں کی حالت کا جائزہ لیا جاتا ہے۔',
 ARRAY['Can cataract surgery be performed on elderly patients?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('phaco-iol-7', 'phaco-iol',
 'کیا موتیے کی سرجری کے بعد مجھے عینک کی ضرورت ہوگی؟',
 'یہ منتخب کیے گئے IOL کی قسم اور مریض کی انفرادی بصری ضروریات پر منحصر ہے۔ کچھ مریضوں کو مخصوص فاصلے یا بعض کاموں کے لیے سرجری کے بعد بھی عینک کی ضرورت پڑ سکتی ہے۔',
 ARRAY['Will I need glasses after cataract surgery?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('q-msydgh3d-146', 'phaco-iol',
 'کیا موتیے کے آپریشن کے بعد موتیا دوبارہ آ سکتا ہے؟',
 'اصل موتیا واپس نہیں آتا، لیکن کبھی lens کے پیچھے جھلی دھندلی ہو سکتی ہے جسے laser سے صاف کیا جا سکتا ہے',
 ARRAY['Can cataract come back after Phaco surgery'],
 '2026-08-18T07:59:29.161Z', '2026-08-18T07:59:29.161Z'),

('q-msydhdqt-632', 'phaco-iol',
 'موتیے کے Phaco آپریشن میں درد ہوتا ہے؟',
 'عموماً درد نہیں ہوتا کیونکہ آنکھ کو drops کے ذریعے سن کر دیا جاتا ہے۔',
 ARRAY['Is Phaco cataract surgery painful'],
 '2026-08-18T08:00:11.477Z', '2026-08-18T08:00:11.477Z'),

('q-msyfhndl-604', 'phaco-iol',
 'موتیے کا آپریشن کتنا کامیاب ہوتا ہے؟',
 'o ایک عام اور مؤثر cataract procedure ہے، اور زیادہ تر مریضوں کو نظر میں واضح بہتری محسوس ہوتی ہے۔ Final result آنکھ کی overall health پر بھی depend کرتا ہے',
 ARRAY['How successful is Phaco cataract surgery'],
 '2026-08-18T08:56:23.193Z', '2026-08-18T08:56:23.193Z'),

('q-msyfjv6y-899', 'phaco-iol',
 'کیا موتیے کے آپریشن کے بعد نظر واقعی صاف ہو جاتی ہے؟',
 'اگر دھندلی نظر کی اصل وجہ موتیا ہو تو زیادہ تر مریض surgery کے بعد واضح فرق محسوس کرتے ہیں۔',
 ARRAY['Does vision become clear after cataract surgery'],
 '2026-08-18T08:58:06.633Z', '2026-08-18T08:58:06.633Z')

ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  updated_at = EXCLUDED.updated_at;

-- CXL Questions
INSERT INTO public.questions (id, category_id, question, answer, keywords, created_at, updated_at) VALUES
('cxl-1', 'cxl',
 'آنکھوں میں CXL کا مقصد کیا ہے؟',
 'CXL میں مخصوص وٹامن ڈراپس اور روشنی کی مدد سے کارنیا کے کمزور ٹشو کو مضبوط کیا جاتا ہے۔ اس کا بنیادی مقصد کیراٹو کونَس جیسی بیماریوں کو مزید بڑھنے سے روکنا یا ان کی رفتار کم کرنا ہے۔',
 ARRAY['What is the purpose of CXL in the eyes?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('cxl-2', 'cxl',
 'کیا CXL کے بعد ریفریکٹیو سرجری کی جا سکتی ہے یا نہیں؟',
 'یہ ہو سکتا ہے۔ یہ پیشنٹ کی کنڈیشن اور ٹیسٹ رزلٹس پر ڈیپینڈ کرتا ہے، کیونکہ سر نارملی یہ پروسیجر کرتے ہیں۔ خاص طور پر CXL کے بعد کچھ پیشنٹس میں Refractive Surgery کی جا سکتی ہے۔ تو ہاں، یہ ہو سکتا ہے، لیکن یہ پیشنٹ ٹو پیشنٹ ڈیپینڈ کرتا ہے۔۔',
 ARRAY['Can refractive surgery be performed after CXL or not?'],
 '2026-08-16T12:41:38.167Z', '2026-08-17T16:24:06.597Z'),

('cxl-3', 'cxl',
 'ایک بار CXL ہو جانے کے بعد اسے کتنی بار دہرایا جا سکتا ہے؟',
 'عام طور پر ایک سیشن کے بعد بیماری کو کنٹرول کرنے کی کوشش کی جاتی ہے، لیکن اگر مستقبل میں کارنیا کی کمزوری یا بیماری کی دوبارہ پیش رفت ثابت ہو تو ڈاکٹر کی نگرانی میں CXL دوبارہ کیا جا سکتا ہے۔',
 ARRAY['Once CXL has been done, how many times can it be repeated?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('cxl-4', 'cxl',
 'کیا CXL ایک آنکھ میں کیا جاتا ہے یا دونوں آنکھوں میں؟',
 'یہ دونوں آنکھوں کی حالت پر منحصر ہے۔ اگر صرف ایک آنکھ میں بیماری کی پیش رفت ہو رہی ہو تو اسی آنکھ کا علاج تجویز کیا جا سکتا ہے، جبکہ طبی ضرورت کے مطابق دونوں آنکھوں کا علاج بھی کیا جا سکتا ہے۔',
 ARRAY['Is CXL done on one eye or both eyes?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('cxl-5', 'cxl',
 'کیا CXL کے بعد کانٹیکٹ لینز کی ضرورت ختم ہو جاتی ہے؟',
 'ضروری نہیں۔ CXL کا بنیادی مقصد کارنیا کو مضبوط کرنا اور بیماری کی پیش رفت کو سست یا روکنا ہے۔ کچھ مریضوں کو واضح نظر کے لیے بعد میں بھی عینک یا کانٹیکٹ لینز کی ضرورت پڑ سکتی ہے۔',
 ARRAY['Does CXL remove the need for contact lenses?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z'),

('q-msyhd96b-794', 'cxl',
 'یہ کیسے پتا چلتا ہے کہ کارنیا کی کمزوری بڑھ رہی ہے؟',
 'پرانے اور نئے کارنیا اسکین اور چشمے کے نمبر کا موازنہ کرکے اس کا پتا چلتا ہے۔',
 ARRAY['How do doctors know if a corneal condition is progressing'],
 '2026-08-18T09:48:57.395Z', '2026-08-18T09:48:57.395Z'),

('q-msyhe81v-620', 'cxl',
 'سی ایکس ایل کارنیا کو مضبوط کیسے کرتا ہے؟',
 'اس میں خاص قطرے اور روشنی استعمال کرکے کارنیا کو مضبوط کیا جاتا ہے۔',
 ARRAY['How does CXL strengthen the cornea'],
 '2026-08-18T09:49:42.595Z', '2026-08-18T09:49:42.595Z'),

('q-msyhf1dl-789', 'cxl',
 'سی ایکس ایل میں وٹامن بی ٹو کے قطرے کیوں ڈالے جاتے ہیں؟',
 'یہ قطرے روشنی کے ساتھ مل کر کارنیا کو مضبوط کرنے میں مدد دیتے ہیں۔',
 ARRAY['Why is vitamin B2 used during corneal cross-linking'],
 '2026-08-18T09:50:20.601Z', '2026-08-18T09:50:20.601Z'),

('q-msyhfvlg-829', 'cxl',
 'سی ایکس ایل کے بعد آنکھ میں کانٹیکٹ لینز کیوں لگایا جاتا ہے؟',
 'یہ لینز آنکھ کو محفوظ رکھنے اور جلد ٹھیک ہونے میں مدد دیتا ہے۔',
 ARRAY['Why is a bandage contact lens placed after CXL'],
 '2026-08-18T09:50:59.764Z', '2026-08-18T09:50:59.764Z'),

('q-msyhgoor-790', 'cxl',
 'سی ایکس ایل کے بعد نظر زیادہ دھندلی ہو جائے تو کیا یہ نارمل ہے؟',
 'جی، شروع میں نظر کچھ دھندلی ہو سکتی ہے اور آہستہ آہستہ بہتر ہوتی ہے۔',
 ARRAY['Is blurred vision normal after CXL'],
 '2026-08-18T09:51:37.467Z', '2026-08-18T09:51:37.467Z'),

('q-msyhho6v-68', 'cxl',
 'سی ایکس ایل کے بعد کام پر کب واپس جا سکتے ہیں؟',
 'اکثر مریض چند دن سے ایک ہفتے میں کام پر واپس آ سکتے ہیں۔',
 ARRAY['When can I return to work after CXL'],
 '2026-08-18T09:52:23.479Z', '2026-08-18T09:52:23.479Z'),

('q-msyhia47-670', 'cxl',
 'سی ایکس ایل کے بعد گاڑی کب چلا سکتے ہیں؟',
 'جب نظر صاف ہو اور معائنے کے بعد اجازت مل جائے تو گاڑی چلائی جا سکتی ہے۔',
 ARRAY['When can I drive after CXL'],
 '2026-08-18T09:52:51.895Z', '2026-08-18T09:52:51.895Z'),

('q-msyhj491-494', 'cxl',
 'کیا سی ایکس ایل کروانے سے کارنیا ٹرانسپلانٹ سے بچا جا سکتا ہے؟',
 'بعض مریضوں میں بروقت سی ایکس ایل کارنیا کو مزید کمزور ہونے سے روک کر ٹرانسپلانٹ کا خطرہ کم کر سکتا ہے۔',
 ARRAY['Can CXL reduce the need for a corneal transplant'],
 '2026-08-18T09:53:30.949Z', '2026-08-18T09:53:30.949Z'),

('q-msyhjzuz-103', 'cxl',
 'اگر کارنیا کی کمزوری ابھی شروع ہوئی ہو تو فوراً سی ایکس ایل کروانا چاہیے؟',
 'یہ کارنیا کے اسکین پر منحصر ہے۔ اگر کمزوری بڑھ رہی ہو تو علاج جلد کرنا بہتر ہو سکتا ہے۔',
 ARRAY['Should early corneal weakness be treated with CXL'],
 '2026-08-18T09:54:11.915Z', '2026-08-18T09:54:11.915Z'),

('q-msyhkmr3-630', 'cxl',
 'کیا سی ایکس ایل کے بعد بھی کارنیا دوبارہ کمزور ہو سکتا ہے',
 'بعض مریضوں میں ایسا ہو سکتا ہے، اسی لیے بعد میں بھی باقاعدہ معائنہ ضروری ہوتا ہے۔',
 ARRAY['Can corneal weakness progress after CXL'],
 '2026-08-18T09:54:41.583Z', '2026-08-18T09:54:41.583Z'),

('q-msyhlc1z-618', 'cxl',
 'سی ایکس ایل کے بعد کارنیا کو مضبوط ہونے میں کتنا وقت لگتا ہے؟',
 'کارنیا کو مکمل طور پر مستحکم ہونے میں کئی ہفتے یا مہینے لگ سکتے ہیں۔',
 ARRAY['How long does the cornea take to stabilize after CXL'],
 '2026-08-18T10:42:40.010Z', '2026-08-18T10:42:40.010Z'),

('q-msyhm0g3-955', 'cxl',
 'میری عمر تیس سال سے زیادہ ہے، کیا پھر بھی سی ایکس ایل ہو سکتا ہے؟',
 'جی، اگر کارنیا کی کمزوری بڑھ رہی ہو تو بڑی عمر میں بھی سی ایکس ایل کی ضرورت پڑ سکتی ہے۔',
 ARRAY['Can people over 30 still need CXL'],
 '2026-08-18T09:55:45.987Z', '2026-08-18T09:55:45.987Z'),

('q-msyhmp3f-861', 'cxl',
 'اگر ایک آنکھ کا کارنیا زیادہ کمزور ہو اور دوسری کا کم، تو کیا دونوں کا علاج ہوگا؟',
 'ضروری نہیں۔ دونوں آنکھوں کے ٹیسٹ الگ دیکھ کر علاج کا فیصلہ کیا جاتا ہے۔',
 ARRAY['Is CXL needed in both eyes if one cornea is more affected'],
 '2026-08-18T09:56:17.931Z', '2026-08-18T09:56:17.931Z')

ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  updated_at = EXCLUDED.updated_at;

-- General Information Questions
INSERT INTO public.questions (id, category_id, question, answer, keywords, created_at, updated_at) VALUES
('general-ur-1', 'general',
 'کلینک کن دنوں میں کھلا ہوتا ہے؟',
 'کلینک پیر سے جمعہ تک کھلا ہوتا ہے۔',
 ARRAY['What days is the clinic open?'],
 '2026-08-18T11:37:22.562Z', '2026-08-18T11:37:22.562Z'),

('general-ur-2', 'general',
 'کلینک کتنے بجے کھلتا ہے؟',
 'کلینک صبح 8:00 بجے کھلتا ہے۔',
 ARRAY['What time does the clinic open?'],
 '2026-08-16T12:41:38.167Z', '2026-08-16T12:41:38.167Z')

ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  updated_at = EXCLUDED.updated_at;

-- Glaucoma Questions
INSERT INTO public.questions (id, category_id, question, answer, keywords, created_at, updated_at) VALUES
('q-msyfm45g-442', 'glaucoma',
 'کیا کالا موتیا مکمل طور پر ٹھیک ہو سکتا ہے؟',
 'کالے موتیے کو مکمل ختم نہیں کیا جا سکتا، لیکن صحیح treatment سے اسے control کیا جا سکتا ہے اور موجودہ نظر کو مزید خراب ہونے سے بچانے کی کوشش کی جاتی ہے۔',
 ARRAY['Can glaucoma be completely cured'],
 '2026-08-18T08:59:51.556Z', '2026-08-18T08:59:51.556Z'),

('q-msyfn88i-136', 'glaucoma',
 'کالے موتیے سے کم ہونے والی نظر واپس آ سکتی ہے؟',
 'کالے موتیے سے optic nerve کو ہونے والا permanent damage عموماً واپس نہیں آتا۔ اسی لیے بیماری کو جلد پکڑنا اور وقت پر علاج شروع کرنا بہت ضروری ہے۔',
 ARRAY['Can vision lost due to glaucoma come back'],
 '2026-08-18T09:00:43.505Z', '2026-08-18T09:00:43.505Z'),

('q-msyfnzj5-898', 'glaucoma',
 'کالے موتیے میں صرف drops کافی ہوتے ہیں یا آپریشن بھی کرنا پڑتا ہے؟',
 'ہر مریض کو operation کی ضرورت نہیں ہوتی۔ بہت سے مریض drops یا laser سے control رہتے ہیں، جبکہ surgery ضرورت کے مطابق کی جاتی ہے۔',
 ARRAY['Are eye drops enough for glaucoma', 'or is surgery needed'],
 '2026-08-18T09:01:18.881Z', '2026-08-18T09:01:18.881Z'),

('q-msyfpe6u-431', 'glaucoma',
 'علاج کے بعد بھی آنکھ کا pressure دوبارہ بڑھ سکتا ہے؟',
 'جی، ایسا ہو سکتا ہے۔ اسی لیے regular follow-up ضروری ہے تاکہ eye pressure اور optic nerve کو monitor کرکے treatment وقت پر adjust کیا جا سکے۔',
 ARRAY['Can eye pressure rise again after glaucoma treatment'],
 '2026-08-18T09:02:24.534Z', '2026-08-18T09:02:24.534Z'),

('q-msyg0l56-933', 'glaucoma',
 'میری نظر ٹھیک ہے، صرف آنکھ کا پریشر زیادہ ہے۔ کیا علاج ضروری ہے؟',
 'جی، زیادہ pressure وقت کے ساتھ optic nerve کو نقصان پہنچا سکتا ہے، اس لیے مکمل check-up ضروری ہے۔',
 ARRAY['my vision is clear but eye pressure is high', 'do I need treatment'],
 '2026-08-18T09:11:06.762Z', '2026-08-18T09:11:06.762Z'),

('q-msyg1h5d-926', 'glaucoma',
 'کیا صرف eye pressure سے پتا چل جاتا ہے کہ کالا موتیا ہے؟',
 'نہیں، pressure کے ساتھ optic nerve اور vision tests بھی ضروری ہوتے ہیں۔',
 ARRAY['Is eye pressure alone enough to diagnose glaucoma'],
 '2026-08-18T09:11:48.241Z', '2026-08-18T09:11:48.241Z'),

('q-msyg32u9-939', 'glaucoma',
 'کالے موتیے میں بار بار نظر کا ٹیسٹ کیوں کیا جاتا ہے؟',
 'اس سے پتا چلتا ہے کہ دائیں بائیں کی نظر کم تو نہیں ہو رہی۔',
 ARRAY['Why is the visual field test repeated in glaucoma'],
 '2026-08-18T09:13:03.009Z', '2026-08-18T09:13:03.009Z'),

('q-msyg3w64-365', 'glaucoma',
 'کالے موتیے میں OCT scan کیوں کیا جاتا ہے؟',
 'اس سے آنکھ کی نس کو باریکی سے دیکھا جاتا ہے کہ کوئی نقصان تو نہیں ہو رہا۔',
 ARRAY['Why is an OCT scan done for glaucoma'],
 '2026-08-18T09:13:41.020Z', '2026-08-18T09:13:41.020Z'),

('q-msyg4p2b-907', 'glaucoma',
 'کیا steroid والے قطرے آنکھ کا دباؤ بڑھا سکتے ہیں؟',
 'جی، کچھ لوگوں میں ایسا ہو سکتا ہے، اس لیے یہ قطرے ڈاکٹر کے مشورے سے استعمال کریں',
 ARRAY['Can steroid eye drops increase eye pressure'],
 '2026-08-18T09:14:18.467Z', '2026-08-18T09:14:18.467Z'),

('q-msyg59mr-478', 'glaucoma',
 'کیا کالے موتیے کے قطرے ہمیشہ لگانے پڑتے ہیں؟',
 'اکثر مریضوں کو یہ قطرے لمبے عرصے تک استعمال کرنا پڑتے ہیں۔',
 ARRAY['Do glaucoma eye drops need to be used long term'],
 '2026-08-18T09:14:45.123Z', '2026-08-18T09:14:45.123Z')

ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  updated_at = EXCLUDED.updated_at;

-- Allergy Questions
INSERT INTO public.questions (id, category_id, question, answer, keywords, created_at, updated_at) VALUES
('q-msygim4m-733', 'allergy',
 'آنکھوں میں بار بار خارش اور پانی آتا ہے، کیا یہ الرجی ہو سکتی ہے؟',
 'جی، خارش، پانی آنا اور لالی آنکھوں کی الرجی کی عام علامات ہیں',
 ARRAY['Can itchy and watery eyes be a sign of eye allergy?'],
 '2026-08-18T09:25:07.846Z', '2026-08-18T09:25:07.846Z'),

('q-msygjrck-965', 'allergy',
 'آنکھوں کی الرجی اور انفیکشن میں کیا فرق ہوتا ہے؟',
 'الرجی میں عموماً خارش زیادہ ہوتا ہے، جبکہ انفیکشن میں گاڑھا مادہ یا دوسری علامات بھی ہو سکتی ہیں۔ صحیح فرق معائنے سے پتا چلتا ہے',
 ARRAY['Difference between eye allergy and an eye infection?'],
 '2026-08-18T09:26:01.268Z', '2026-08-18T09:26:01.268Z'),

('q-msygo6q4-920', 'allergy',
 'آنکھوں کی الرجی میں ٹھنڈی پٹی رکھنے سے فائدہ ہوتا ہے؟',
 'جی، ٹھنڈی پٹی سے خارش اور سوجن میں آرام مل سکتا ہے۔',
 ARRAY['Can a cold compress help relieve eye allergy symptoms'],
 '2026-08-18T09:29:27.820Z', '2026-08-18T09:29:27.820Z'),

('q-msygoyom-210', 'allergy',
 'کیا الرجی کی وجہ سے پلکیں بھی سوج سکتی ہیں؟',
 'جی، الرجی کی وجہ سے پلکوں میں سوجن آ سکتی ہے۔',
 ARRAY['Can eye allergies cause swollen eyelids'],
 '2026-08-18T09:30:04.054Z', '2026-08-18T09:30:04.054Z'),

('q-msygpnma-229', 'allergy',
 'الرجی کے دوران کانٹیکٹ لینز پہن سکتے ہیں؟',
 'بہتر ہے الرجی ٹھیک ہونے تک کانٹیکٹ لینز نہ پہنیں۔',
 ARRAY['Can I wear contact lenses while I have eye allergies'],
 '2026-08-18T09:30:36.370Z', '2026-08-18T09:30:36.370Z'),

('q-msygqanq-491', 'allergy',
 'کیا آنکھوں کی الرجی سے نظر دھندلی ہو سکتی ہے؟',
 'جی، زیادہ الرجی کی صورت میں کچھ وقت کے لیے نظر دھندلی ہو سکتی ہے۔',
 ARRAY['Can eye allergies cause blurred vision'],
 '2026-08-18T09:31:06.230Z', '2026-08-18T09:31:06.230Z')

ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  updated_at = EXCLUDED.updated_at;

-- =============================================================
-- SEED COMPLETE
-- After running this, enable Realtime in Supabase Dashboard:
-- Go to Database → Replication
-- Enable replication for: categories, questions
-- =============================================================
