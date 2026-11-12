# Managed-language font libraries: public API surface and feature inventory

A verifiable survey of the public interface and feature set of font libraries in the Java/JVM, .NET/C#, JavaScript/TypeScript and Python ecosystems, assembled as a best-of-breed union of capabilities for a latecomer font library written in MoonBit.

## Scope, method and conventions

- Twenty-seven named libraries or API surfaces are covered: six in the JVM ecosystem, five in .NET/C#, nine in JavaScript/TypeScript and seven in Python. A "surface" means one coherent public API; where a vendor ships several cooperating types under one licence and repository these are treated as one entry (for example the whole `java.awt.font` stack, or PDFBox plus its FontBox submodule).
- Identifiers, type names, versions, licences and URLs were checked against primary sources wherever possible: official project documentation, Javadoc and .NET API reference pages, GitHub and npm README files, NuGet and PyPI listings, and readthedocs sites. Anything that could not be confirmed against a primary source is explicitly tagged **unverified** rather than being omitted or paraphrased into a plausible-looking name.
- Versions are those observed on the cited pages on 12 November 2026. A stable version that could not be pinned is marked **unverified** instead of being guessed. Several projects publish versioned forks under different package names; these are listed separately where they carry a distinct API.
- Two names in the brief resolve to maintained successors. "JetBrains Skija" is covered through its upstream Skia bindings whose current API is published as Skiko (`org.jetbrains.skia`); "Typography.OpenFont" is covered through its documented successor OpenFontSharp, which exposes the same core types. Both are flagged inline.
- No identifiers or versions in this document are invented. Where a capability is asserted from a secondary synopsis rather than an API reference, it is tagged accordingly.

### Legend for the capability matrices

| Symbol | Meaning |
| --- | --- |
| `Y` | Supported by the documented public API |
| `P` | Partial, limited or delegated to an optional component |
| `N` | Not supported |
| `–` | Not applicable to this kind of library |
| `?` | Unverified |

`Bmap` means embedded bitmap strikes; `COLR` means COLR/CPAL layered colour glyphs (v0 or v1 as noted); `SVG` means OpenType SVG-table glyphs or SVG-font glyphs; `Var` means variable fonts and/or instancing; `GPOS` means kerning and glyph positioning; `Shape` means OpenType/Indic/Arabic shaping; `Vert` means vertical writing metrics or layout; `SDF` means signed-distance-field output; `LCD` means subpixel/LCD rendering; `Atlas` means glyph atlas or glyph raster caching; `FBack` means font fallback or system font matching; `Subset` means glyph subsetting; `Write` means writing or compiling font binaries rather than merely consuming them.

---

## Summary capability matrix

### Matrix A — container and glyph-format support

| Library | TTF | OTF/CFF | CFF2 | TTC | WOFF | WOFF2 | Bmap | COLR | sbix | SVG |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `java.awt.font` (Java2D) | Y | Y | ? | Y | N | N | P | ? | ? | ? |
| Apache FontBox (+ PDFBox) | Y | Y | ? | Y | N | N | N | N | N | N |
| Apache FOP | Y | Y | ? | ? | N | N | N | N | N | N |
| iText (Core/7) | Y | Y | ? | Y | N | N | N | N | N | N |
| Skija / Skiko | Y | Y | ? | P | N | N | P | ? | ? | ? |
| opentype4j | Y | P? | N | ? | N | N | N | N | N | Y (output) |
| SixLabors.Fonts | Y | Y | Y | Y | Y | Y | ? | Y (v0+v1) | ? | Y |
| SkiaSharp | Y | Y | ? | P | N | N | Y | ? | ? | ? |
| SharpFont | Y | Y | ? | Y | N | N | Y | ? | ? | P |
| System.Drawing / WPF media | Y | Y | ? | ? | N | N | P | ? | ? | ? |
| Typography.OpenFont / OpenFontSharp | Y | Y | ? | ? | Y | Y | ? | Y (v0) | ? | ? |
| opentype.js | Y | Y | N | N | Y | P | N | Y (v0) | N | Y |
| fontkit | Y | Y | ? | Y | Y | Y | Y (sbix) | Y | Y | ? |
| Typr.js / Typr.ts | Y | Y | ? | Y | ? | ? | N | P | N | Y |
| harfbuzzjs | – | – | – | – | – | – | – | – | – | – |
| fonteditor-core | Y | Y (read) | N | ? | Y | Y | N | ? | ? | Y |
| capsize | P | P | ? | – | – | – | – | – | – | – |
| Canvas `TextMetrics` / `measureText` | Y | Y | ? | ? | Y | Y | – | Y | – | – |
| WOFF2 tooling (wawoff2 / woff2) | – | – | – | – | – | Y | – | – | – | – |
| opentype-feature-freeze | P | P | ? | – | – | – | – | – | – | – |
| fontTools | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Pillow / PIL `ImageFont` | Y | Y | ? | Y | N | N | P | Y | Y? | ? |
| freetype-py | Y | Y | Y | Y | N | N | Y | ? | ? | Y |
| uharfbuzz | Y (blob) | Y (blob) | ? | ? | N | N | – | – | – | – |
| reportlab | Y | P | N | P | N | N | N | N | N | N |
| matplotlib.font_manager | Y | Y | ? | ? | N | N | – | – | – | – |
| glyphsLib | – | – | – | – | – | – | – | – | – | – |

`WOFF2` for opentype.js is marked partial because the library expects Brotli decompression to be performed beforehand (the README names `wawoff2` and `Module.decompress`). Canvas `TextMetrics` rows describe what the browser accepts, not what the JS API parses itself. glyphsLib consumes Glyphs source files and UFO/Designspace documents rather than SFNT binaries, hence the "not applicable" entries.

### Matrix B — layout, rendering and engineering features

| Library | Var | Hint | GPOS | Shape | Vert | SDF | LCD | Atlas | FBack | Subset | Write |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `java.awt.font` (Java2D) | P | Y | Y | Y | Y | N | Y | P | Y | N | N |
| Apache FontBox (+ PDFBox) | N | N | P | P | Y | N | N | N | P | Y | N |
| Apache FOP | N | N | P | P | ? | N | N | Y | Y | Y | N |
| iText (Core/7) | N | N | P | P | ? | N | N | Y | Y | Y | N |
| Skija / Skiko | ? | Y | Y (Shaper) | Y | ? | N | Y | Y | Y | N | N |
| opentype4j | N | N | N | N | N | N | N | N | N | N | N (image/SVG only) |
| SixLabors.Fonts | Y | Y | Y | Y | Y | N | ? | P | Y | N | N |
| SkiaSharp | P | Y | Y | Y | P | N | Y | Y | Y | N | N |
| SharpFont | Y | Y | P | N (needs HarfBuzz) | Y | Y | Y | Y | N | N | N |
| System.Drawing / WPF media | ? | Y | Y | Y | Y | N | Y | Y | Y | N | N |
| Typography.OpenFont / OpenFontSharp | Y | N | Y | P | ? | N | N | N | N | Y | Y |
| opentype.js | Y | Y | P | P | N | N | N | N | N | P | Y |
| fontkit | Y (AAT) | N | Y | Y | P | N | N | N | N | Y | Y |
| Typr.js / Typr.ts | P | N | Y | Y | P | N | N | N | N | N | N |
| harfbuzzjs | Y | – | Y | Y | Y | N | N | N | N | P? | N |
| fonteditor-core | N | Y | P | N | N | N | N | N | N | P | Y |
| capsize | N | – | – | – | – | – | – | – | P (font stack) | N | N |
| Canvas `TextMetrics` / `measureText` | ? | Y | Y | Y | P | N | Y | Y | Y | N | N |
| WOFF2 tooling | – | – | – | – | – | – | – | – | – | – | Y (SFNT bytes) |
| opentype-feature-freeze | N | – | Y | P | – | – | – | – | – | P | Y |
| fontTools | Y | Y | Y | Y | Y | N | N | N | N | Y | Y |
| Pillow / PIL `ImageFont` | Y | Y | Y | Y | Y | N | ? | P | N | N | N |
| freetype-py | Y | Y | P | N (needs HarfBuzz) | Y | Y | Y | P | N | N | N |
| uharfbuzz | Y | – | Y | Y | Y | N | N | N | N | ? | N |
| reportlab | N | N | N | N | N | N | N | N | Y | Y | N |
| matplotlib.font_manager | – | – | – | – | – | – | – | – | Y | N | N |
| glyphsLib | Y | – | P | – | – | – | – | – | – | N | Y |

---

# 1. Java / JVM ecosystem

## 1.1 `java.awt.Font`, `FontMetrics`, `GlyphVector`, `TextLayout`, `TextAttribute` (Java2D)

- **Name / version / licence.** The Java2D text stack in the Java Class Library, `java.desktop` module; part of the JDK (Oracle JDK and OpenJDK builds). Current long-term line at the time of writing is JDK 21/25; the API is stable and documented in the JDK 12, JDK 27 early-access and legacy JDK 6 Javadocs. Licensed under the GPLv2 with Classpath Exception for OpenJDK (the class library is not a standalone redistributable library). **Version of a standalone artefact: not applicable / unverified.**
- **Positioning.** A rendering-and-layout stack, not a font-file parser. It consumes installed or registered fonts through the platform font manager and exposes measurement, shaping and glyph-outline access.
- **Source.** `https://docs.oracle.com/en/java/javase/12/docs/api/java.desktop/java/awt/Font.html`; `https://docs.oracle.com/javase/6/docs/api/java/awt/font/TextLayout.html`; `https://download.java.net/java/early_access/jdk27/docs/api/java.desktop/java/awt/Font.html`.

**Public interface by concern**

- *Container / font construction.* `java.awt.Font(String, int, float)`, `Font.createFont(int, InputStream)`, `Font.createFont(int, File)`, `Font.createFonts(InputStream)`, `Font.createFonts(File)`, `Font.getFont(Map<? extends Attribute,?>)`, `Font.deriveFont(float)`, `Font.deriveFont(int)`, `Font.deriveFont(Map)`, `Font.getFamily()`, `Font.getFontName()`, `Font.getPSName()`, `Font.getStyle()`, `Font.isBold()`, `Font.isItalic()`, `Font.isPlain()`, `Font.getTransform()`, `Font.hasLayoutAttributes()`, `Font.hasUniformLineMetrics()`, `Font.textRequiresLayout(char[], int, int)`, `Font.getNumGlyphs()`, `Font.canDisplay(char)`, `Font.canDisplay(int)`, `Font.canDisplayUpTo(String)`.
- *Character mapping.* `Font.createGlyphVector(FontRenderContext, String)`, `Font.createGlyphVector(FontRenderContext, char[])`, `Font.createGlyphVector(FontRenderContext, CharacterIterator)`, `Font.layoutGlyphVector(FontRenderContext, char[], int, int, int)`, `GlyphVector.getGlyphCode(int)`, `GlyphVector.getGlyphCodes(int, int, int[])`, `GlyphVector.getNumGlyphs()`.
- *Glyph outlines.* `GlyphVector.getOutline()`, `GlyphVector.getOutline(float, float)`, `GlyphVector.getGlyphOutline(int)`, `GlyphVector.getGlyphVisualBounds(int)`, `GlyphVector.getVisualBounds()`, `GlyphVector.getPixelBounds(FontRenderContext, float, float)`, `GlyphVector.getGlyphMetrics(int)`, `GlyphVector.getGlyphPosition(int)`, `GlyphVector.setGlyphPosition(int, Point2D)`, `GlyphVector.getGlyphTransform(int)`, `GlyphVector.performDefaultLayout()`.
- *Metrics.* `FontMetrics.stringWidth(String)`, `FontMetrics.getAscent()`, `getDescent()`, `getLeading()`, `getHeight()`, `getMaxAscent()`, `getMaxDescent()`, `getMaxAdvance()`, `getWidths()`, `getStringBounds(...)` (several overloads taking `String`, `char[]`, `CharacterIterator`, `Graphics`), `getMaxCharBounds(FontRenderContext)`, `hasUniformLineMetrics()`, `getFontRenderContext()`. `Font.getStringBounds(...)` (overloads with `FontRenderContext`) and `Font.getMaxCharBounds(FontRenderContext)`. `GlyphMetrics.getAdvanceX()`, `getAdvanceY()`, `getBounds2D()`, `getLSB()`, `getRSB()`, `getType()`, `isCombining()`, `isComponent()`, `isLigature()`, `isStandard()`, `isWhitespace()`.
- *Layout / shaping.* `java.awt.font.TextLayout(String, Font, FontRenderContext)`, `TextLayout(String, Map, FontRenderContext)`, `TextLayout(AttributedCharacterIterator, FontRenderContext)`, `TextLayout.getAdvance()`, `getVisibleAdvance()`, `getAscent()`, `getDescent()`, `getLeading()`, `getBounds()`, `getLogicalBounds()`, `getPixelBounds(FontRenderContext, float, float)`, `getBaseline()`, `getBaselineOffsets()`, `getJustifiedLayout(float)`, `handleJustify(float)`, `getCharacterCount()`, `isLeftToRight()`, `getOutline(AffineTransform)`, `draw(Graphics2D, float, float)`, `getBlackBoxBounds(int, int)`, `getCaretShapes(int)`, `getCaretShapes(int, Rectangle2D)`, `hitTestChar(float, float)`, `getNextRightmostHit(int)`, `getVisualOtherHit(TextHitInfo)`, `toString()`. Related: `java.awt.font.LineBreakMeasurer`, `TextMeasurer`, `AttributedString`, `FontRenderContext`, `TextHitInfo`, `java.text.AttributedCharacterIterator`, and `TextAttribute` constants (`TextAttribute.FAMILY`, `SIZE`, `WEIGHT`, `POSTURE`, `LIGATURES`, `KERNING`, `TRACKING`, `SUPERSCRIPT`, `UNDERLINE`, `STRIKETHROUGH`, `RUN_DIRECTION`, `BIDI_EMBEDDING`, `NUMERIC_SHAPING`, `CHAR_REPLACEMENT`, `FOREGROUND`, `BACKGROUND`, `SWAP_COLORS`, `INPUT_METHOD_HIGHLIGHT`, `JUSTIFICATION`, `FONT`, `TRANSFORM`, `WIDTH`, `BASELINE_TRANSFORM` — exact constant set unverified in the consulted pages but conventional).
- *Rasterisation.* Delegated to `Graphics2D.drawString`, `drawGlyphVector`, `TextLayout.draw`; anti-aliasing and LCD/subpixel behaviour configured through `RenderingHints` and `FontRenderContext` (`isAntiAliased()`, `usesFractionalMetrics()`, `getTransform()`).

**Feature coverage.** See the matrices above. TTF and OTF/CFF are handled by the platform font manager; TTC through `createFonts`, which explicitly returns every font in a collection. `TextLayout` performs full complex-script layout, bidirectional text, kerning and ligature substitution, justification, caret hit testing and multiple baselines (roman, centered, hanging). Vertical writing is supported through `GlyphVector` flags (`FLAG_HAS_TRANSFORMS`, `FLAG_HAS_POSITION_ADJUSTMENTS`, `FLAG_RUN_RTL`, `FLAG_COMPLEX_GLYPHS`, `FLAG_MASK`, `FLAG_HAS_REORDERING`) and `Font.layoutGlyphVector`. Measurements vary with `FontRenderContext` and device hints. WOFF/WOFF2, variable-font instancing, colour glyph tables and font writing are not part of the API.

**Architectural stance.** A renderer and layout engine with a mutable, stateful graphics context; no direct table access. `Font` is immutable, `GlyphVector` is mutable (glyph positions and transforms can be edited), `TextLayout` is immutable and cloneable. I/O is coupled to platform font discovery and `InputStream`/`File`. Errors surface as `FontFormatException`, `IOException`, `IndexOutOfBoundsException` and `IllegalArgumentException`. Layout results are floating-point and device-dependent, so comparisons require a fixed `FontRenderContext`.

**Suitability as a differential-test oracle.** Moderate but awkward. `FontMetrics.stringWidth` returns integer pixels, `getMaxAdvance` is coarse, and all `TextLayout` bounds are floating-point and influenced by anti-aliasing and fractional-metrics hints. `GlyphVector.getOutline()` yields a `java.awt.Shape` whose path iterator is a usable outline command stream, and `getGlyphVisualBounds`/`getPixelBounds` give comparable boxes. Offline reproducibility is poor unless the JDK build, installed fonts, locale and `FontRenderContext` are pinned. Best used as a cross-check on simple advances rather than as a golden reference.

**Worth stealing for moonfont.** The strict separation between *logical bounds* (`getStringBounds`, `getLogicalBounds`) and *visual/ink bounds* (`getBounds`, `getVisualBounds`, `getPixelBounds`) is the clearest naming in any surveyed API. A latecomer library should expose advance, logical box, tight ink box and device pixel box as four distinct, explicitly named quantities rather than one ambiguous "bounds".

## 1.2 Apache FontBox (the font subsystem of Apache PDFBox)

- **Name / version / licence.** FontBox is shipped inside Apache PDFBox. Observed releases: PDFBox **3.0.8** and **2.0.37** (the site lists 3.0.8 released 2026-07-11 and 2.0.37 released 2026-07-15). Apache License 2.0.
- **Positioning.** A pure-Java SFNT/TTF/OTF/CFF parser and subsetter feeding PDF font embedding; it exposes the underlying tables as typed objects rather than rasterising.
- **Source.** `https://pdfbox.apache.org/`; `https://pdfbox.apache.org/docs/2.0.4/javadocs/org/apache/fontbox/ttf/package-summary.html`; Javadoc for `TTFParser` at `https://pdfbox.apache.org/docs/2.0.6/javadocs/org/apache/fontbox/ttf/TTFParser.html`.

**Public interface by concern**

- *Container / table access.* `org.apache.fontbox.ttf.TrueTypeFont` with `getCmap()`, `getUnicodeCmapLookup()`, `getUnicodeCmapLookup(boolean)`, `getGlyph()`, `getAdvancedWidth(int)` (verified name variant: `getAdvanceWidth` is the conventional accessor — **unverified exact spelling**), `getNumberOfGlyphs()`, `getUnitsPerEm()`, `getHeader()`, `getHorizontalHeader()`, `getHorizontalMetrics()`, `getIndexToLocation()`, `getMaximumProfile()`, `getNaming()`, `getOS2WindowsMetrics()`, `getPostScript()`, `getKerning()`, `getVerticalHeader()`, `getVerticalMetrics()`, `getVerticalOrigin()`, `getTableBytes(...)` — most of these exact declarations are **unverified** beyond the table classes below. `TTFTable`, `CmapTable`, `GlyphTable`, `HeaderTable`, `HorizontalHeaderTable`, `HorizontalMetricsTable`, `IndexToLocationTable`, `KerningTable`, `KerningSubtable`, `MaximumProfileTable`, `NamingTable`, `NameRecord`, `OS2WindowsMetricsTable`, `PostScriptTable`, `DigitalSignatureTable`, `CFFTable`, `OTLTable`, `VerticalHeaderTable`, `VerticalMetricsTable`, `VerticalOriginTable`, `OpenTypeFont`, `TrueTypeCollection`, `TrueTypeCollection.TrueTypeFontProcessor`, `WGL4Names`, `BufferedRandomAccessFile`, `TTFDataStream`.
- *Parsing.* `TTFParser()` with constructors `TTFParser(boolean isEmbedded)` and `TTFParser(boolean isEmbedded, boolean parseOnDemand)`; `parse(String)`, `parse(File)`, `parse(InputStream)`, `parseEmbedded(InputStream)`, `protected readTable(TrueTypeFont, String)`, `protected allowCFF()`. `OTFParser` extends `TTFParser`. `org.apache.fontbox.cff.CFFParser` and related `CFFFont`, `CFFType1Font`, `CFFCIDKeyedFont` classes (**exact class names unverified**). `TrueTypeCollection.processAllFonts(TrueTypeFontProcessor)`.
- *Character mapping.* `CmapSubtable` with `getGlyphId(int)`, `getCharacterCode(int)`, `initSubtable(CmapTable, int, TTFDataStream)`; `CmapTable.getCmaps()`, `CmapTable.getSubtable(int platformId, int platformEncodingId)`, `CmapTable.setCmaps(CmapSubtable[])`; `TrueTypeFont.getUnicodeCmap()` (deprecated), `getUnicodeCmap(boolean)` (deprecated), `getUnicodeCmapLookup()`, `SubstitutingCmapLookup(CmapSubtable, GlyphSubstitutionTable, List<String>)`.
- *Glyph outlines.* `GlyphData` with `getXMin()`, `getYMin()`, `getXMax()`, `getYMax()`, `getNumberOfContours()`, `getGlyphDescription()`, `getBoundingBox()` (**exact declarations partly unverified**); `GlyphDescription` (interface), `GlyfDescript`, `GlyfSimpleDescript`, `GlyfCompositeDescript`, `GlyfCompositeComp`.
- *Metrics.* `HorizontalMetricsTable.getAdvanceWidth(int)`, `getLeftSideBearing(int)`; `HeaderTable.getUnitsPerEm()`, `getXMin()`, `getYMin()`, `getXMax()`, `getYMax()`, `getMacStyle()`; `HorizontalHeaderTable.getAscender()`, `getDescender()`, `getLineGap()`, `getAdvanceWidthMax()`, `getNumberOfHMetrics()`; `OS2WindowsMetricsTable.getTypoAscender()`, `getWinAscent()`, `getCapHeight()`, `getHeight()` (**exact names partly unverified**).
- *Subsetting / writing.* `TTFSubsetter` (verified as a class in the package summary); `org.apache.fontbox.ttf.TTFSubsetter` with `subset(...)`, `writeTo(OutputStream)` (**exact declarations unverified**).
- *Font discovery.* `org.apache.fontbox.util.autodetect.FontFileFinder`, `FontDirFinder` and OS-specific finders; `FontFileFinder.find()` returns `List<URI>`.

**Feature coverage.** TTF (`TTFParser`), OTF/CFF (`OTFParser`, `OpenTypeFont`, `CFFParser`, `CFFTable`), TTC (`TrueTypeCollection`), legacy `kern` and GSUB (`GlyphSubstitutionTable`, `OTLTable`), vertical metrics (`VerticalHeaderTable`, `VerticalMetricsTable`, `VerticalOriginTable`), and TTF subsetting (`TTFSubsetter`). No WOFF/WOFF2, no colour glyph tables, no variable fonts, no rasterisation or hinting interpreter, no LCD/subpixel, no shaping pipeline. `parseOnDemand` gives lazy table parsing.

**Architectural stance.** Pure data model over a random-access stream, with a deliberate `parseOnDemand` flag; tables are typed mutable Java objects. I/O is coupled to `InputStream`/`File`/`RandomAccessRead`. Errors are checked `IOException` plus `DamagedFontException` (named in a secondary source; **unverified**). Very little rendering coupling.

**Suitability as a differential-test oracle.** Good and underrated. `TrueTypeFont.getUnicodeCmapLookup()` gives a deterministic character-to-glyph map; `HorizontalMetricsTable` gives integer advance widths in font units; `GlyphData` gives integer `xMin/yMin/xMax/yMax` bounding boxes; `CmapSubtable.getGlyphId(int)` is a pure function. Pure Java, no native dependencies, fully offline and deterministic given a font file. It is an excellent second oracle for cmap/advance/bbox triples, independent of fontTools.

**Worth stealing for moonfont.** The `parseOnDemand` constructor flag is a small but excellent API decision: one parser type, two memory/latency profiles, chosen explicitly by the caller. Expose lazy table access as `getTable(tag)` returning a lazily decompiled, cached table object, so an inspector touches only the tables it reads.

## 1.3 Apache FOP

- **Name / version / licence.** Apache XML Graphics FOP; Apache License 2.0. **Current stable version unverified** from the consulted sources (the iText legal page confirms FOP code is Apache-2.0 and points at `https://xmlgraphics.apache.org/fop/`).
- **Positioning.** An XSL-FO to PDF (and other formats) formatter whose font subsystem loads, caches, metrics and embeds TTF/OTF/Type1 fonts; it is a document layout engine, not a standalone font API.
- **Source.** `https://xmlgraphics.apache.org/fop/`; `https://xmlgraphics.apache.org/fop/download.html`.

**Public interface by concern.** Concrete font class names are **unverified** against a primary FOP Javadoc in this survey; the identifiers below are the conventional FOP font API and are flagged as such: `org.apache.fop.fonts.FontInfo`, `FontTriplet`, `FontMetrics`, `FontResolver`, `FontCache`, `EmbedFontInfo`, `CustomFont`, `LazyFont`, `MultiByteFont`, `SingleByteFont`, `CIDFont`, `Typeface`, `FontSetup`, `FontAdder`, `FontDetector`, `FontReader`, `TTFFile`, `Glyphs`, `CodePointMapping`. Verified from primary sources: FOP supplies hyphenation code reused by iText, and FOP is Apache-2.0 licensed.

**Feature coverage.** TTF and OTF/CFF loading and embedding, font-subset generation during PDF output, font fallback/configuration via the FOP configuration file, and a font cache. GSUB/GPOS and complex shaping are limited (the `pdfCalligraph`-style shaping is an iText add-on, not FOP core). No WOFF/WOFF2, no variable fonts, no colour glyphs, no SDF, no font-file writing.

**Architectural stance.** Rendering/document pipeline with a mutable font cache and a configuration-driven font resolver; I/O coupled to font file paths and the FOP config; errors via `FOPException` and font-loading warnings. **Unverified** in detail.

**Suitability as a differential-test oracle.** Poor. Results are entangled with PDF output, subsetting order and configuration; there is no clean per-glyph numeric API to compare. Use only for end-to-end PDF regression, not as a metrics oracle.

**Worth stealing for moonfont.** The `FontTriplet` (family, style, weight) as an immutable lookup key resolved through a configurable `FontResolver`/fallback chain is a clean way to separate *what the document asked for* from *which face was chosen*.

## 1.4 iText (Core / iText 7 and later)

- **Name / version / licence.** iText Core, published by Apryse Group NV; dual-licensed **AGPLv3 or a commercial licence**. iText 7.x is the current API line (the consulted API reference is 7.1.3 Java and 7.2.0 .NET); iText 5 and earlier used the `com.lowagie.text` packages under MPL/LGPL and are a different API. **Current stable version unverified.**
- **Positioning.** A PDF creation/manipulation library with a font layer that parses TTF/OTF/TTC/Type1, computes metrics and embeds subsets. Complex-script shaping (`pdfCalligraph`) and other add-ons are commercial (verified from a secondary licensing review).
- **Source.** `https://itextpdf.com/how-buy/legal/copyright-intellectual-property`; `https://api.itextpdf.com/iText/java/7.1.3/com/itextpdf/io/font/FontProgramFactory.html`; `https://api.itextpdf.com/iText/dotnet/7.2.0/classi_text_1_1_i_o_1_1_font_1_1_font_program_factory.html`.

**Public interface by concern**

- *Container / construction (verified).* `com.itextpdf.io.font.FontProgram`, `FontProgramFactory.createFont()`, `createFont(String)`, `createFont(String, boolean cached)`, `createFont(byte[])`, `createFont(byte[], boolean)`, `createFont(String ttc, int ttcIndex, boolean cached)`, `createFont(byte[] ttc, int ttcIndex, boolean cached)`, `createType1Font(byte[] afm, byte[] pfb[, boolean])`, `createType1Font(String metricsPath, String binaryPath[, boolean])`, `createRegisteredFont(String[, int style][, boolean cached])`, `registerFont(String path)`, `registerFont(String path, String alias)`, `registerFontFamily(String familyName, String fullName, String path)`, `registerFontDirectory(String dir)`, `registerSystemFontDirectories()`, `getRegisteredFonts()`, `getRegisteredFontFamilies()`, `isRegisteredFont(String)`, `clearRegisteredFonts()`, `clearRegisteredFontFamilies()`. .NET variant uses PascalCase (`CreateFont`, `RegisterFontDirectory`, `GetRegisteredFonts`, ...).
- *PDF-facing font.* `com.itextpdf.kernel.font.PdfFont`, `PdfFontFactory.createFont(FontProgram, String encoding, boolean embedded)`, `PdfFontFactory.createFont(String path, boolean embedded)`, `PdfEncodings.WINANSI` (verified from tutorials). `TrueTypeFont` and `Type1Font` as `FontProgram` subclasses (**exact Java class names unverified**).
- *Metrics / glyphs (partly unverified).* `FontProgram.getFontMetrics()`, `getWidth(int)`, `getWidth(String)`, `getGlyph(int)`, `getGlyphByCode(int)`, `getPdfFontEncodings()`, `countOfGlyphs()`, `getFontNames()`, `getKerning(int, int)`, `isFontSpecific()`, `PdfFont.getWidth(int)`, `getWidth(String, float)`, `getGlyph(int)`, `convertToBytes(String)`, `decode(String)`, `appendTo(...)`. **These exact declarations are unverified** against the consulted pages.
- *Subsetting / embedding.* Embedding and subsetting are driven by `PdfFont`/`PdfWriter`; `PdfFont.addSubsetRange(int[])`, `flush()` (**unverified**).

**Feature coverage.** TTF, OTF, TTC (explicit `ttcIndex`), Type1/AFM/PFM, CJK Adobe Asian Font Packs; font caching and registry/directory discovery; automatic subsetting on PDF embed. Complex-script shaping is an optional commercial add-on. No WOFF/WOFF2, no variable fonts, no colour glyph tables, no font-file writing.

**Architectural stance.** Document pipeline with a global, mutable `FontProgramFactory` registry and an internal font cache; I/O coupled to paths, bytes and PDF output streams; errors as `IOException` plus iText runtime exceptions. `FontProgram` is a shared immutable-ish parsed program; `PdfFont` is per-document state. Licensing is a hard architectural constraint (AGPL or commercial).

**Suitability as a differential-test oracle.** Poor to moderate. `FontProgram` widths are integer-ish and could be dumped, but the public API is oriented toward PDF output and the global cache introduces state. Only worth using if the project already depends on iText.

**Worth stealing for moonfont.** `createFont(String ttc, int ttcIndex, boolean cached)` — naming the collection index and the caching decision as explicit parameters is a tidy, honest API. Also the separation of a shared `FontProgram` (parsed bytes, reusable) from a per-document `PdfFont` (encoding, embedding, subset state) is a good mutability boundary.

## 1.5 JetBrains Skija / Skiko (`Typeface`, `Font`, `FontMgr`, `TextLine`, `Shaper`)

- **Name / version / licence.** Skija was the JetBrains Java binding to Skia; it is superseded by **Skiko** (Kotlin multiplatform Skia bindings, `org.jetbrains.skia`), whose API is published at `https://jetbrains.github.io/skiko/`. Apache License 2.0 (Skia lineage) — **exact Skiko licence unverified**; Skija's Getting Started page is at `https://github.com/JetBrains/skija/blob/.../docs/Getting%20Started.md`. **Version unverified.**
- **Positioning.** A hardware-accelerated 2D graphics binding; the font types wrap Skia's font engine and provide shaping, text lines, glyph bounds and path extraction.
- **Source.** `https://jetbrains.github.io/skiko/skiko/org.jetbrains.skia/-font/index.html`; `https://github.com/JetBrains/skija/.../docs/Getting%20Started.md`; `https://deepwiki.com/JetBrains/skiko/7.5.2-shaping-textblob-and-textline`; `https://docs.skia.org`.

**Public interface by concern**

- *Container / construction (verified, Skiko Kotlin API).* `Typeface.makeFromFile(String)`, `Typeface.makeDefault()`, `FontMgr.getDefault().matchFamilyStyle("Menlo", FontStyle.NORMAL)` (Skija Java form); `Font()`, `Font(Typeface?)`, `Font(Typeface?, size: Float)`, `Font(Typeface?, size: Float, scaleX: Float, skewX: Float)`; `Font.setTypeface`, `makeWithSize(size)`, `typeface`, `size`, `scaleX`, `skewX`, `spacing`, `metrics`.
- *Character mapping / glyph ids (verified).* `Font.getStringGlyphs(s: String): ShortArray`, `getStringGlyphsCount(s: String?): Int`, `getUTF32Glyph(unichar: Int): Short`, `getUTF32Glyphs(uni: IntArray?): ShortArray`.
- *Glyph outlines and bounds (verified).* `Font.getPath(glyph: Short): Path?`, `getPaths(glyphs: ShortArray?): Array`, `getBounds(glyphs: ShortArray?): Array`, `getBounds(glyphs, p: Paint?)`, `getPositions(glyphs)`, `getPositions(glyphs, offset: Point)`, `getWidths(glyphs): FloatArray`, `getXPositions(glyphs): FloatArray`, `getXPositions(glyphs, offset: Float)`.
- *Metrics (verified).* `Font.metrics: FontMetrics`, `spacing: Float`, `measureText(s, p?): Rect`, `measureTextWidth(s): Float`, `measureTextWidth(s, p)`. `TextLine` (verified from the Skiko source synopsis): `ascent`, `descent`, `capHeight`, `xHeight`, `leading`, `width`, `height`, `getOffsetAtCoord(x)`, `getLeftOffsetAtCoord(x)`, `getCoordAtOffset(offset)`.
- *Layout / shaping.* `Shaper`, `TextBlob`, `TextLine`, `TextBlobBuilder`, `ParagraphBuilder`, `Paragraph`, `RunHandler` / `TextLineRunHandler` (verified class names; exact method declarations partly **unverified**). `Shaper.makeShapeDontWrapOrReorder()`, `shape(...)` (**unverified**). `FontMgr`, `FontStyle`, `Typeface`, `FontVariation` (**unverified**).
- *Rasterisation flags (verified).* `Font.edging: FontEdging`, `hinting: FontHinting`, `isAutoHintingForced`, `isBaselineSnapped`, `isEmboldened`, `isLinearMetrics`, `isSubpixel`, `areBitmapsEmbedded()`, `setBitmapsEmbedded(Boolean)`, `setTypeface`.

**Feature coverage.** TTF/OTF/CFF through Skia; embedded bitmap strikes (`areBitmapsEmbedded`); hinting and edging modes; subpixel positioning; `FontMgr` family/style matching and fallback; `Shaper`/`TextLine` for complex scripts with ICU-based grapheme clustering and bidirectional handling; glyph outlines via `getPath`; hit testing and caret geometry. No font-file writing, no subsetting, no COLR/CPAL/sbix at the API level, no SDF. Variable-font coverage **unverified**.

**Architectural stance.** A renderer binding with native resource management (`Managed`, `close()`, `isClosed`, `nativePtr`). `Font` is a thin mutable handle over a native `SkFont`; `Typeface` is expensive and cached. I/O coupled to native Skia and file paths. Errors are JVM exceptions from the native bridge. Outline data is returned as immutable `Path` values.

**Suitability as a differential-test oracle.** Moderate. `getStringGlyphs`, `getWidths`, `getXPositions`, `getBounds` and `getPath` yield comparable integer glyph ids and floating-point widths/bounds/paths, but they are derived from the pinned native Skia build and its font manager, so results are Skia-version and platform dependent. Good as a secondary cross-check for glyph-id sequences and advance arrays.

**Worth stealing for moonfont.** `Font.getPath(glyph)` returning a nullable `Path` (null when the glyph is bitmap-described) and `getPaths(glyphs)` returning an array that may contain nulls is an honest, explicit way to represent "outline or bitmap", far better than throwing or returning an empty path. Also `measureText` (ink rect) versus `measureTextWidth` (advance) as separate calls is worth copying.

## 1.6 opentype4j

- **Name / version / licence.** `opentype4j` by Jkanon; **MIT** licence (verified from the README and Gitee mirror). **Version: no releases published (verified: "No releases published" on the repository); current version unverified.**
- **Positioning.** A small Java OpenType parser specialised in converting text or glyphs to SVG paths and raster images.
- **Source.** `https://github.com/Jkanon/opentype4j/blob/master/README.md`; `https://gitee.com/lt1946/opentype4j`.

**Public interface by concern (verified)**

- *Container.* `OpenType.parse(filePath)` returns a `Font`.
- *Character mapping / glyph outlines.* `Font.getPath(String text)`, `Font.getPath()` (all glyphs, default grid), `Font.nameToGlyph(String name)` returning a `GlyphData`.
- *Glyph-level.* `GlyphData.getPath()`, `GlyphData.getPath(FontCell fontCell)`.
- *Path / output.* `Path.toSVG()`, `Path.toSVG(String filePath)`, `Path.toImage(File)`, `Path.toImage(File, ImageFormat)`, `Path.toImageBytes()`, `Path.toImageBytes(ImageFormat)`; `ImageFormat` with JPEG and PNG.

**Feature coverage.** Reads OpenType/TrueType outlines and emits SVG path strings and JPEG/PNG images. No cmap API is exposed by name (mapping happens inside `getPath(String)`), no metrics API, no shaping, no variation, no colour fonts, no subsetting, no font writing. OTF/CFF support is **unverified** in detail.

**Architectural stance.** A thin converter: parse once into a `Font`, then produce immutable `Path` values serialised to SVG or an image. I/O coupled to file paths. Error model **unverified** (no exception types documented).

**Suitability as a differential-test oracle.** Low but useful for one thing: `Path.toSVG()` produces a deterministic textual outline stream that can be diffed as a string, which is a cheap golden-file oracle for glyph outline command sequences. No metrics or cmap access limits it.

**Worth stealing for moonfont.** `toSVG()` / `toPathData()` style serialisation on the path object itself, with an explicit precision argument in the wider ecosystem, is the cheapest possible golden-file format for outline regression. Expose path-to-string on the path type, not only on the font.

---

# 2. C# / .NET ecosystem

## 2.1 SixLabors.Fonts

- **Name / version / licence.** `SixLabors.Fonts`; version **1.0.0** (announced), **2.0.0** on NuGet, and a current **3.0.0** major (the docs mention "3.0.0 in the current major" and licence-key enforcement "from 2.2.0 in the previous major and 3.0.0 in the current major"). Licensed under the **Six Labors Split License, Version 1.0** (verified from the official docs and the 2.0.0 NuGet page). Note the licence changed from Apache 2.0 for v1.x (verified from the 1.0.0 announcement: "v1.x is licensed under the Apache 2.0 license") to the Split License for v2/v3 — worth recording because it affects usability as an oracle.
- **Positioning.** A fully managed, dependency-free .NET font loading, measurement, shaping, layout, inspection and custom-rendering library; the font engine behind ImageSharp.Drawing.
- **Source.** `https://sixlabors.com/products/fonts/`; `https://docs.sixlabors.com/api/Fonts/SixLabors.Fonts.html`; `https://docs-v2.sixlabors.com/api/Fonts/SixLabors.Fonts.html`; `https://docs.sixlabors.com/articles/fonts/gettingstarted.html`; `https://sixlabors.com/posts/announcing-fonts-100/`; `https://www.nuget.org/packages/SixLabors.Fonts/2.0.0`.

**Public interface by concern**

*Note on versions.* The brief names `GlyphMetrics`, `TextRenderer`, `FontRectangle`, `IDeepCloneable` and `TextLayout`. `FontRectangle`, `TextRenderer`, `IGlyphRenderer` and a `GlyphMetrics` class are verified in the **v1/v2-era** `docs-v2` namespace listing. `TextLayout` and `IDeepCloneable` could **not be verified** against the consulted SixLabors.Fonts pages (`IDeepCloneable` is a general SixLabors/ImageSharp interface); both should be treated as legacy or unverified. The current API replaces `TextRenderer` with `TextMeasurer`/`TextShaper`/`TextBlock` and redefines `GlyphMetrics` as a struct. Both surfaces are documented below.

- *Container / collection (verified, current).* `FontCollection`, `FontCollection.Add(string)`, `Add(Stream)`, `Add(Stream, out FontDescription)`, `AddCollection(string)` (for `.ttc`), `AddSystemFonts()`, `AddWithCulture(...)`, `Get(string)`, `TryGet(string, out FontFamily)`, `GetByCulture(...)`, `TryGetByCulture(...)`; `FontFamily` (struct) with `CreateFont(float)`, `CreateFont(float, FontStyle)`, `CreateFont(float, params FontVariation[])`, `TryGetMetrics(FontStyle, out FontMetrics)`; `FontDescription.LoadDescription(...)`, `LoadFontCollectionDescriptions(...)`, `FontDescription.FontFamilyInvariantCulture`; `SystemFonts.CreateFont(string, float)`, `SystemFonts.CreateFont(string, float, FontStyle)`, `SearchDirectories`, `AddSystemFonts()`; `IFontCollection`, `IReadOnlyFontCollection`, `IReadOnlySystemFontCollection`, `FontCollectionExtensions`.
- *Font instance (verified).* `Font`, `Font.Size`, `Font.Family`, `Font.RequestedStyle`, `Font.FontMetrics`, `Font.VariationSettings` (**exact members partly unverified**); `FontStyle`, `FontVariation`, `KnownVariationAxes` (registered axis tags), `FontPalette`, `FontPaletteOverride`, `FontDescription`, `FontException`, `InvalidFontFileException`, `InvalidFontTableException`, `MissingFontTableException`, `FontFamilyNotFoundException`, `GlyphMissingException`.
- *Metrics (verified).* `FontMetrics`, `FontRectangle` (struct — "four single precision floating points"), `HorizontalMetrics`, `VerticalMetrics`, `IMetricsHeader`, `GlyphBounds`, `Glyph`, `GlyphMetrics` (current struct: "one laid-out glyph entry in final layout order"), `GlyphRendererParameters`, `GlyphColor`, `GlyphType`, `CodePoint`, `CodePoint.IsNewLine(...)`.
- *Layout / measurement (verified, current).* `TextOptions(Font)` with `WrappingLength`, `TextDirection`, `HintingMode`, `FallbackFontFamilies`, `ColorFontSupport`, `Dpi`, `LineSpacing`, `TextInteractionMode`, `KerningMode`, `LayoutMode`, `TextAlignment`, `WordBreaking`, `TextJustification`, `TextAttributes`, `TextDecorations`, `HorizontalAlignment`, `VerticalAlignment`; `TextMeasurer.Measure(text, options)`, `MeasureAdvance`, `MeasureSize`, `MeasureBounds`, `TryMeasureCharacterAdvances(text, options, out ReadOnlySpan<...>)`, `TryMeasureCharacterSizes`, `TryMeasureCharacterBounds`; `TextMetrics` with `Advance`, `Bounds`, `RenderableBounds`, `GetSelectionBounds(start, length)`, `GetLineLayouts(...)`; `TextBlock`, `LineLayout`, `LineLayoutEnumerator`, `LineMetrics`, `TextRun`, `TextShaper`, `TextShapingBuffer`, `ShapedGlyph`, `GraphemeMetrics`, `WordMetrics`, `CaretPosition`, `TextHit`, `TextPlaceholder`, `ClipBounds`, `FontMatch`, `IFontFallbackResolver`, `SystemFontFallbackResolver`.
- *Rendering surfaces (verified, v1/v2-era).* `IGlyphRenderer` ("a surface that can have a glyph rendered to it as a series of actions"), `IGlyphRendererExtensions`, `IColorGlyphRenderer`, `IGlyphDecorationRenderer`, `TextRenderer`, `TextMeasurer`, `TextLayout` (**unverified**), `IDeepCloneable` (**unverified**), `GlyphOptions`, `GlyphColor`, `TextDecorationOptions`.
- *Table access (verified).* `SixLabors.Fonts.Tables.AdvancedTypographic` namespace; `FontDescription.LoadDescription` for metadata-only reads.
- *Enums (verified).* `ColorFontSupport` (with `ColrV1`, `ColrV0`, `Svg` flags as used in the product example), `HintingMode`, `KerningMode`, `LayoutMode`, `TextDirection`, `TextAlignment`, `FontStyle`, `GlyphType`, `WordBreaking`, `TextJustification`, `TextAttributes`, `TextDecorations`.

**Feature coverage.** TTF, OTF/CFF, **CFF2**, WOFF, WOFF2 (all verified from the official product and intro pages), TTC via `AddCollection`, COLR v0 and v1 paint-graph colour fonts, SVG colour fonts, variable fonts via `FontVariation`/`KnownVariationAxes`, FreeType v40-compatible TrueType hinting, GSUB/GPOS shaping, bidirectional text, Arabic/Hebrew/Indic/Myanmar/Thai/Lao shaping, fallback families, OpenType feature requests (ligatures, fractions, tabular figures, stylistic sets), vertical metrics, line breaking (UAX 14 per the 2.0.0 NuGet page), hit testing, caret movement, selection geometry, and layered paint / gradient colour glyph rendering. No font-file writing or subsetting. SDF/SDF caching and LCD/subpixel are not exposed.

**Architectural stance.** Fully managed, no native dependencies (verified: "no native dependencies to ship", runs on .NET 8+). Layered design: collection → family → concrete `Font` → `TextOptions` → `TextMetrics`/`TextBlock`. `TextBlock` explicitly prepares shaped text once for repeated measurement/rendering, a deliberate caching/mutability boundary. `IGlyphRenderer` is the pen/builder analogue: the library drives glyph geometry into a caller-supplied surface instead of owning a rasteriser. Errors are a typed hierarchy (`FontException`, `InvalidFontFileException`, `InvalidFontTableException`, `MissingFontTableException`, `GlyphMissingException`, `FontFamilyNotFoundException`). I/O is decoupled via `Stream`.

**Suitability as a differential-test oracle.** Good, with reservations. It is pure managed code, deterministic, offline, and exposes comparable outputs (`TextMetrics.Advance`, `Bounds`, `RenderableBounds`, per-glyph `GlyphMetrics`, `ShapedGlyph` sequences). The licence-key enforcement from 2.2.0/3.0.0 complicates CI, and shaping results depend on the library's own Unicode tables rather than HarfBuzz, so it is best used as an independent cross-check against a HarfBuzz-based oracle rather than as the sole reference. v1.x (Apache 2.0) remains the frictionless choice for an offline oracle.

**Worth stealing for moonfont.** `IGlyphRenderer` — "a surface that can have a glyph rendered to it as a series of actions" — is the single best reusable abstraction in this survey, and it generalises cleanly into the pen protocol: define a trait/interface of `moveTo/lineTo/quadTo/cubicTo/closePath` callbacks, then let one outline decoder drive rasterisation, SVG export, bounds computation and hit testing without knowing anything about them. Pair it with `TextBlock`, which separates *shape once* from *measure/render many times*.

## 2.2 SkiaSharp

- **Name / version / licence.** `SkiaSharp`, the .NET binding to Google Skia; **MIT** licence (verified in a third-party licence listing). Version **1.49.1** is described as the first stable release in a secondary analysis; **1.56.0** appears in DNDocs; current stable **unverified**.
- **Positioning.** A cross-platform 2D graphics binding; font types are thin managed wrappers over native Skia (`SKTypeface`, `SKFont`, `SKPaint`, `SKTextBlob`, `SKShaper`).
- **Source.** `https://learn.microsoft.com/en-us/dotnet/api/skiasharp.skfont`; `https://learn.microsoft.com/en-sg/dotnet/api/skiasharp.skpaint`; `https://docs.dndocs.com/n/SkiaSharp/1.56.0/api/SkiaSharp.SKPaint.html`; `https://zetcode.com/csharp/skiasharp/`.

**Public interface by concern**

- *Container / discovery (verified).* `SKTypeface.Default`, `SKTypeface.FromFamilyName(string, SKFontStyle)`, `SKTypeface.FromFile(string)`, `SKTypeface.FromStream(Stream)`, `FamilyName`, `FontStyle`, `UnitsPerEm`, `GlyphCount`, `GetGlyphs(string)`, `GetGlyphCount()`, `ContainsGlyphs(string)`, `CountGlyphs(string)`, `GetGlyphPath(int)`, `GetTableData(uint tag)` (**exact members partly unverified**); `SKFontManager.Default`, `MatchFamily`, `MatchCharacter`, `CreateTypeface`, `GetFontFamilies()`, `FamilyCount`.
- *Font instance (verified).* `SKFont()`, `SKFont(SKTypeface, float size, float scaleX = 1, float skewX = 0)`; properties `Typeface`, `Size`, `ScaleX`, `SkewX`, `Spacing`, `Metrics`, `Edging`, `Hinting`, `ForceAutoHinting`, `EmbeddedBitmaps`, `Embolden`, `BaselineSnap`, `LinearMetrics`, `Subpixel`; methods `MeasureText(string)`, `MeasureText(string, ref SKRect)`, `BreakText(string, float maxWidth)`, `BreakText(string, float, out float measuredWidth)`, `CountGlyphs(string)`, `ContainsGlyph(int)`, `ContainsGlyphs(string)`, `GetGlyphs(string)`, `GetGlyphWidths(string)`, `GetGlyphPositions(string)`, `GetTextPath(string, float, float)`.
- *Paint (verified).* `SKPaint` with `Typeface`, `TextSize`, `TextAlign`, `TextEncoding`, `TextScaleX`, `TextSkewX`, `IsAntialias`, `IsStroke`, `StrokeWidth`, `LcdRenderText`, `SubpixelText`, `IsEmbeddedBitmapText`, `IsLinearText`, `IsAutohinted`, `HintingLevel`, `FontMetrics`, `FontSpacing`, `DeviceKerningEnabled` (obsolete), `FakeBoldText`, `IsVerticalText` (obsolete), `FilterQuality`, `Color`, `ColorF`, `Shader`, `ColorFilter`, `ImageFilter`, `MaskFilter`, `PathEffect`; methods `MeasureText`, `BreakText`, `GetTextPath`, `GetFontMetrics(out SKFontMetrics, float)`, `ContainsGlyphs`, `CountGlyphs`, `Clone()`.
- *Text blobs / shaping.* `SKTextBlob`, `SKTextBlobBuilder`, `SKTextBlobBuilder.AddRun`, `Build()`, `SKShaper`, `SKShaper.Shape(...)` (**exact declarations unverified**); `SKCanvas.DrawText(...)`, `DrawTextBlob(...)`. `SKFontMetrics`, `SKRect`, `SKTextAlign`, `SKTextEncoding`, `SKFontStyle`, `SKFontEdging`, `SKFontHinting`.

**Feature coverage.** TTF/OTF via Skia, embedded bitmap strikes (`EmbeddedBitmaps`, `IsEmbeddedBitmapText`), hinting and auto-hinting, subpixel positioning, LCD rendering (`LcdRenderText`), edging modes, font metrics and line spacing, glyph ids and widths, glyph outline paths via `GetTextPath`/`GetGlyphPath`, text blobs and HarfBuzz-backed shaping through `SKShaper` (verified as a SkiaSharp.HarfBuzz component; exact API **unverified**), font-manager matching and fallback. No WOFF/WOFF2 at the managed API, no colour-glyph tables exposed, no subsetting, no font writing, no SDF.

**Architectural stance.** A native-binding renderer with `SKNativeObject`/`SKObject` resource ownership and `Dispose()`; `SKPaint` is mutable and cloneable; glyph data lives in native Skia. I/O coupled to native libraries, streams and file paths. Errors are .NET exceptions over native status codes. `SKFont` (modern) deliberately separates font state from `SKPaint` (paint state), a migration from the older paint-centric text API.

**Suitability as a differential-test oracle.** Moderate. `SKFont.GetGlyphs`, `GetGlyphWidths`, `MeasureText`, `GetTextPath` and `SKFontMetrics` produce comparable outputs, but they depend on the pinned native Skia version, the platform font manager and hinting settings; `LinearMetrics` and `Subpixel` must be fixed to get stable numbers. Good for cross-checking glyph ids and unhinted advances.

**Worth stealing for moonfont.** The explicit `LinearMetrics` / `Subpixel` / `Hinting` / `Edging` switches. Making hinting and subpixel positioning *caller-controlled booleans* rather than hidden renderer state is essential for reproducible metrics and for a differential test that must agree with a pure data model.

## 2.3 SharpFont (FreeType bindings for .NET)

- **Name / version / licence.** `SharpFont`, originally by Robert Rouhani, currently maintained as forks (for example `Yellow-Dog-Man/SharpFont` and `space-wizards/SharpFont`). **MIT** licence (verified from the README, which also notes the bundled FreeType binary is under the FreeType License, FTL). **Version unverified.** Requires a native `freetype6.dll`/libfreetype at runtime.
- **Positioning.** A near-complete managed wrapper over the FreeType C API, exposing the full public API including format-specific functions and the caching subsystem.
- **Source.** `https://github.com/Yellow-Dog-Man/SharpFont` (README text consulted via mirrors); `http://github.chaintip.org/space-wizards/SharpFont`.

**Public interface by concern**

- *Container (verified).* `Face(Library, string path)`, `Face(Library, string path, int faceIndex)`; `Library`, `FT`, `Face` properties mirroring FreeType (`FamilyName`, `StyleName`, `NumFaces`, `NumGlyphs`, `NumFixedSizes`, `AvailableSizes`, `IsScalable`, `IsSfnt`, `IsFixedWidth`, `IsCIDKeyed`, `IsTricky`, `Ascender`, `Descender`, `Height`, `MaxAdvanceWidth`, `MaxAdvanceHeight`, `UnderlinePosition`, `UnderlineThickness`, `Size`, `Charmap`, `Charmaps`, `Glyph`, `BBox`, `UnitsPerEm`).
- *Character mapping / glyph loading.* `Face.GetCharIndex(uint)`, `SelectCharmap(Encoding)`, `SelectSize(int strikeIndex)`, `SetCharSize(...)`, `SetPixelSizes(...)`, `LoadGlyph(uint index, LoadFlags flags, LoadTarget target)`, `LoadChar(uint charcode, LoadFlags, LoadTarget)`. **Exact method declarations unverified** but they follow the FreeType C API closely.
- *Glyph slot / rasterisation.* `GlyphSlot`, `GlyphSlot.Render(RenderMode)`, `GlyphSlot.Metrics`, `GlyphSlot.Bitmap`, `GlyphSlot.BitmapLeft`, `BitmapTop`, `Outline`, `Advance`, `LinearHoriAdvance`, `LinearVertAdvance`, `Format`, `GetGlyph()`; `FTBitmap`, `Outline.Decompose(...)`, `Outline.GetBBox()`, `Outline.GetCBox()`, `Outline.Points`, `Outline.Tags`, `Outline.Contours`, `Outline.NContours`, `Outline.NPoints`; `GlyphMetrics`, `SizeMetrics`, `Charmap`, `RenderMode`, `LoadFlags`, `LoadTarget`, `PixelMode`, `OutlineFlags`, `FT_Vector`, `FT_Matrix`, `FT_BBox`. **Most exact identifiers unverified.**
- *Advanced.* LCD filtering, `Library.SetLcdFilter`, `SetLcdFilterWeights`, multiple-master / variable-font structures (`FT_MM_Var`, `FT_Var_Axis`, `FT_Var_Named_Style`), OT-SVG renderer hooks, `FTC_Manager` caching subsystem (verified at feature level: "Everything from format-specific APIs to the caching subsystem are included"). **Exact names unverified.**
- *Errors.* FreeType error codes are converted into exceptions, and single-`out` methods return their value directly (verified from the README).

**Feature coverage.** Everything FreeType offers: TTF/OTF/CFF/CFF2, TTC and multi-face files, embedded bitmap strikes, variable fonts via multiple-master structures, OT-SVG support, native TrueType hinting and auto-hinting, LCD/subpixel filtering, outline decomposition and raster coverage bitmaps, vertical metrics. Shaping is explicitly not included (`SharpFont.HarfBuzz` is a separate companion). No WOFF/WOFF2 at the managed API, no subsetting, no font writing, no SDF.

**Architectural stance.** A thin, idiomatic .NET binding: instance methods rather than C-style statics, exceptions rather than error codes, `IDisposable` resource ownership, but still tightly coupled to a native FreeType shared library. `Face` is mutable state (a glyph slot is overwritten on each load). I/O coupled to file paths and native memory.

**Suitability as a differential-test oracle.** Good for rasterisation and outline decomposition, poor for hermetic reproducibility. `Outline.Decompose` with `move_to/line_to/conic_to/cubic_to` callbacks yields a clean command stream, and `GlyphSlot.Bitmap` yields a coverage bitmap. But hinting, auto-hinting and LCD filtering are FreeType-build- and version-specific, so the FreeType version and load flags must be pinned.

**Worth stealing for moonfont.** Converting error codes to exceptions and turning single-`out` C functions into methods that return their value (verified README) is the right ergonomic wrapper for a MoonBit binding over any C font library. Also, the `Outline.Decompose` callback shape (`moveTo`, `lineTo`, `conicTo`, `cubicTo`) is a second, independent instance of the pen idea.

## 2.4 System.Drawing and System.Windows.Media (`GlyphRun`, `GlyphTypeface`, `FormattedText`)

- **Name / version / licence.** Part of .NET / .NET Framework and Windows Desktop; `System.Drawing.Common` (Windows-only from .NET 6 onward) and WPF `PresentationCore.dll`. MIT-licensed .NET runtime; WPF is part of Windows/.NET. Versions follow .NET (the consulted page is `net-8.0`). **Standalone version not applicable.**
- **Positioning.** Platform text APIs. `System.Drawing` is a GDI+ wrapper; `System.Windows.Media` (WPF) exposes a low-level glyph-run model with direct access to the underlying OpenType face.
- **Source.** `https://learn.microsoft.com/en-ca/dotnet/api/system.windows.media.glyphtypeface?view=net-8.0`; `https://technet.microsoft.com/en-us/subscriptions/system.windows.media.glyphrun.aspx`; `https://technet.microsoft.com/zh-cn/ms602447`.

**Public interface by concern (verified for WPF)**

- *Container / face.* `GlyphTypeface`, constructors `GlyphTypeface()`, `GlyphTypeface(Uri)`, `GlyphTypeface(Uri, StyleSimulations)`; properties `FontUri`, `GlyphCount`, `CharacterToGlyphMap`, `AdvanceWidths`, `AdvanceHeights`, `LeftSideBearings`, `RightSideBearings`, `TopSideBearings` (**unverified**), `BottomSideBearings`, `DistancesFromHorizontalBaselineToBlackBoxBottom`, `Baseline`, `Height`, `CapsHeight`, `XHeight` (**unverified**), `Stretch`, `Style`, `Weight` (**unverified**), `StyleSimulations`, `Symbol`, `FaceNames`, `FamilyNames`, `Copyrights`, `Descriptions`, `DesignerNames`, `DesignerUrls`, `ManufacturerNames`, `LicenseDescriptions`, `SampleTexts`, `EmbeddingRights`, `StrikethroughPosition`, `StrikethroughThickness`, `UnderlinePosition` (**unverified**); methods `GetGlyphOutline(ushort, double, double)`, `GetFontStream()`, `ComputeInkBoundingBox` (**some unverified**), `GetAdvanceWidths` (**unverified**), `GetBitmap(...)` (**unverified**).
- *Glyph run.* `GlyphRun` with constructors `GlyphRun(float pixelsPerDip)` and the full `GlyphRun(GlyphTypeface, int bidiLevel, bool isSideways, double renderingEmSize, float pixelsPerDip, IList<ushort> glyphIndices, Point baselineOrigin, IList<double> advanceWidths, IList<Point> glyphOffsets, IList<char> characters, string deviceFontName, IList<ushort> clusterMap, IList<bool> caretStops, XmlLanguage language)`; properties `GlyphIndices`, `AdvanceWidths`, `GlyphOffsets`, `GlyphTypeface`, `Characters`, `ClusterMap`, `CaretStops`, `BaselineOrigin`, `BidiLevel`, `IsSideways`, `FontRenderingEmSize`, `PixelsPerDip`, `Language`, `DeviceFontName`, `IsHitTestable`; methods `BuildGeometry()`, `ComputeAlignmentBox()`, `ComputeInkBoundingBox()`, `GetCaretCharacterHitFromDistance(double, bool)`, `GetDistanceFromCaretCharacterHit(CharacterHit)`, `GetNextCaretCharacterHit(CharacterHit)`, `GetPreviousCaretCharacterHit(CharacterHit)`.
- *Higher-level.* `FormattedText` (verified by name in the GlyphTypeface remarks, which describe it as producing the `GlyphRun` objects), `GlyphRunDrawing`, `Glyphs` (XAML element), `TextFormatter`, `TextLine`, `CharacterHit`, `XmlLanguage`.
- *System.Drawing.* `System.Drawing.Font`, `FontFamily`, `FontStyle`, `Graphics.MeasureString`, `MeasureCharacterRanges`, `DrawString`, `TextRenderer.MeasureText`, `DrawText`, `StringFormat`, `PrivateFontCollection`, `InstalledFontCollection`, `FontCollection.Families`. **Exact members partly unverified.**

**Feature coverage.** TTF/OTF through the platform font system; `CharacterToGlyphMap` is the raw `cmap`; per-glyph advance widths/heights and side bearings; composite glyph outlines and bitmaps via `GetGlyphOutline`/`GetFontStream`; `GlyphRun` for a single face/size/style with cluster maps, bidi level, sideways (vertical) flag, caret stops, hit testing and geometry/ink/alignment boxes; ClearType and subpixel rendering at the platform level; font fallback through the WPF font system. No WOFF/WOFF2, no variable-font instancing API, no colour glyph tables, no subsetting, no font writing.

**Architectural stance.** `GlyphTypeface` is a low-level, mostly read-only view of a physical face; `GlyphRun` is an explicit, fully materialised glyph buffer (the caller supplies indices, advances, offsets, clusters). This is the most "data-oriented" of the platform APIs: the shaping result is a public object you can inspect and construct, not an opaque rendered image. I/O is coupled to font URIs and the OS font store; `ISupportInitialize` (`BeginInit`/`EndInit`) governs construction; errors are standard .NET exceptions.

**Suitability as a differential-test oracle.** Moderate and Windows-specific. `GlyphTypeface.AdvanceWidths`, `CharacterToGlyphMap`, `BottomSideBearings`, `GlyphRun.ComputeInkBoundingBox()` and `BuildGeometry()` are directly comparable, but the OS font substitution and ClearType/DPI settings make cross-machine reproducibility poor. Fine as a Windows-only cross-check.

**Worth stealing for moonfont.** `GlyphRun`'s explicit parallel arrays (`GlyphIndices`, `AdvanceWidths`, `GlyphOffsets`, `Characters`, `ClusterMap`, `CaretStops`) plus three distinctly named boxes (`ComputeAlignmentBox`, `ComputeInkBoundingBox`, and the geometry from `BuildGeometry`) is the best-worked example of a shaped-run value type. Keeping the character-to-glyph `ClusterMap` public is especially important for caret and selection behaviour and is often omitted.

## 2.5 Typography.OpenFont / OpenFontSharp

- **Name / version / licence.** `Typography.OpenFont` (PixelFarm / LayoutFarm lineage) and its maintained pure-C# successor **OpenFontSharp**; the NuGet listing shows **OpenFontSharp 1.4.0** (and 1.2.2), targeting .NET 10. **MIT** licence for the Typography project (verified from the kniEngine mirror: "A license for a whole project is MIT", with per-file headers drawn from Apache-2.0, MIT, BSD and FTL sources). OpenFontSharp licence **unverified**; it is described as based on Typography.OpenFont.
- **Positioning.** A lightweight, pure-C# OpenType reader with metadata, cmap, outlines, measurement, basic shaping, subsetting and WOFF2 conversion utilities for document applications; explicitly "not a PDF writer, a complete text-layout engine, or a ready-made rasterizer".
- **Source.** `https://www.nuget.org/packages/OpenFontSharp/`; `https://www.nuget.org/packages/OpenFontSharp/1.2.2`; `https://patch-diff.githubusercontent.com/kniEngine/kniDependencies.Typography`.

**Public interface by concern (verified from OpenFontSharp 1.4.0)**

- *Container / discovery.* `OpenFontReader`, `new OpenFontReader().Read(stream)`, `OpenFontReader.ReadPreview` (metadata-only); `Woff2Converter.ToSfnt`, `FontLoader.FromTypeface(typeface, bytes)`, `FontInfo` (`UnitsPerEm`, `Ascent`, `GlyphWidths`), `TypefaceExtensions.TrimDown` / `RestoreUp`.
- *Typeface.* `Typeface` with `Name`, `GlyphCount`, `GetGlyphIndex(char)`, `GetAdvanceWidthFromGlyphIndex(ushort)`, `GetColorLayers`, `GetPalette`, `ColorTableVersion`.
- *Glyphs.* `Glyph`, `IGlyphTranslator` (the pen/builder analogue: a callback interface the caller implements to receive outline segments), `Glyph` outline access via the translator.
- *Metrics / measurement.* `TextMeasurer.MeasureWidth(Typeface, string, double)`; `HorizontalMetrics`-style data via `FontInfo.GlyphWidths` (indexed by glyph id).
- *Shaping.* `BasicLatinShaper` (basic glyph substitution and legacy kerning); `Typography.GlyphLayout` in the original project drives GSUB/GPOS.
- *Subsetting / writing.* `FontSubsetter`, `FontSubsetter.Subset(..., axisCoordinates)` producing a static TrueType instance at chosen axis values; `ToUnicodeCMapBuilder` mapping two-byte PDF character ids to Unicode scalars.
- *Other (verified from the Typography mirror).* Core modules `Typography.OpenFont` (font reader, Open Font Format ISO/IEC 14496-22:2015, WOFF 1.0 and 2.0, GSUB/GPOS) and `Typography.GlyphLayout`; `PixelFarm.Typography` links the core to a renderer; `Typography.One` as a friendlier facade. Formats registered by name: `TTFFont`, `WOFFFont`, `WOFF2Font`, `TrueTypeCollection`, `DFont` (these are fontkit names from a different section — the Typography equivalents are **unverified**).

**Feature coverage.** TTF, OTF/CFF, WOFF, WOFF2, TTF/OTF table access, cmap and glyph outlines, COLR v0 layers and CPAL palettes (`GetColorLayers`, `GetPalette`, `ColorTableVersion`), COLR v1 fonts load but paint graphs are not interpreted, variable-font static instancing through `FontSubsetter.Subset(..., axisCoordinates)`, basic Latin shaping and optional GPOS, glyph subsetting with id remapping, ToUnicode CMap generation, and WOFF2→SFNT conversion with host-supplied Brotli. No rasterisation, no complex-script shaping, no line breaking, no bidi, no font fallback, no SDF/LCD/atlas. Errors: malformed data reported as `InvalidDataException`; the reader bounds collection and cmap counts before allocation (verified).

**Architectural stance.** Pure data model with drawing callbacks (`IGlyphTranslator`) — explicitly not a renderer. The reader closes the supplied stream, so callers must provide a fresh seekable stream per read (verified). `TrimDown`/`RestoreUp` temporarily unload outlines while keeping metrics, an unusually explicit memory-management API. Metrics are in font design units, with conversion left to the caller.

**Suitability as a differential-test oracle.** Very good for a managed-language oracle. Pure C#, no native dependencies, offline, deterministic; `GetGlyphIndex`, `GetAdvanceWidthFromGlyphIndex` and `FontInfo.GlyphWidths` produce integer design-unit values; `IGlyphTranslator` produces a comparable outline command stream. The main caveat is that `TextMeasurer.MeasureWidth` deliberately applies no kerning or shaping.

**Worth stealing for moonfont.** `TypefaceExtensions.TrimDown` / `RestoreUp` — an explicit, reversible "release the heavy outline data but keep the metrics" operation. Combined with `OpenFontReader.ReadPreview` (metadata only) versus `Read` (full), it gives a three-tier access model: preview, metrics-only, and full outlines. A latecomer library should make these tiers explicit rather than silently loading everything.

---

# 3. JavaScript / TypeScript ecosystem

## 3.1 opentype.js

- **Name / version / licence.** `opentype.js` by Frederik De Bleser and contributors; **MIT** licence (verified from a third-party OSS notice citing version 1.3.4, and from the project README lineage). Versions observed: **1.3.3** (unpkg README), **1.3.4** (third-party notice), and the release workflow example names **1.3.5**. **Current stable: 1.3.4 (reported); exact latest unverified.**
- **Positioning.** A pure-JS OpenType/TrueType parser, inspector, editor and writer that turns text into Bézier paths; runs in Node.js and the browser.
- **Source.** `https://github.com/opentypejs/opentype.js`; `https://app.unpkg.com/opentype.js@1.3.3/files/README.md`; `https://opentype.js.org/`.

**Public interface by concern**

- *Container / table access (verified).* `opentype.parse(buffer)`, `opentype.load(url)` / `load(url, callback)` (**exact declaration unverified**); `new opentype.Font({ familyName, styleName, unitsPerEm, ascender, descender, glyphs })`; `Font.glyphs` (indexed list), `Font.unitsPerEm`, `Font.ascender`, `Font.descender`, `Font.numGlyphs`, `Font.names`, `Font.tables`, `font.toTables()`, `font.toArrayBuffer()`, `font.download()`, `GlyphRenderOptions`. Table objects reachable as `font.tables.cmap`, `font.tables.gsub`, `font.tables.os2` (`sTypoAscender`, `usWinAscent`, `sxHeight`, `sCapHeight`), `font.tables.head`, `font.tables.hhea`, `font.tables.maxp`, `font.tables.fvar`, `font.tables.gvar` (**some verified from a detailed third-party code analysis, tagged secondary**).
- *Character mapping (verified).* `Font.charToGlyph(char)`, `Font.charToGlyphIndex(char)`, `Font.stringToGlyphs(string)`, `Font.hasChar(char)`, `Font.getKerningValue(leftGlyph, rightGlyph)`, `Font.getAdvanceWidth(text, fontSize, options)`.
- *Glyph outlines (verified).* `Glyph` with `font`, `name`, `unicode`, `unicodes`, `index`, `advanceWidth`, `leftSideBearing`, `xMin`, `yMin`, `xMax`, `yMax`, `path`, `getPath(x, y, fontSize)`, `getBoundingBox()` returning `{x1, y1, x2, y2}` (`opentype.BoundingBox`), `getMetrics()` (`xMin/yMin/xMax/yMax/leftSideBearing/rightSideBearing`), `draw(ctx, x, y, fontSize)`, `drawPoints`, `drawMetrics`. `Path` with `commands` (array of `{type: 'M'|'L'|'Q'|'C'|'Z', x, y, x1, y1, x2, y2}`), `fill`, `stroke`, `strokeWidth`, `moveTo`, `lineTo`, `curveTo`, `bezierCurveTo`, `quadraticCurveTo`, `close()`, `closePath()`, `extend`, `getBoundingBox()`, `toPathData(decimalPlaces)`, `toSVG(decimalPlaces)`, `toDOMElement`, `fromSVG`, `draw(ctx)`. The brief's `PathCommand` is represented by these command dictionaries rather than a named class — **`PathCommand` as a named exported type is unverified**.
- *Layout / shaping.* `Font.getPath(text, x, y, fontSize, options)`, `getPaths(...)`, `draw(...)`, `drawPoints(...)`, `drawMetrics(...)`; options `script`, `language`, `kerning`, `features` (`liga`, `rlig`), `hinting`, `fill`, `colorFormat`. `Substitution` and `Layout` as named public classes are **unverified**; the verified shaping surface is `getPath`/`getAdvanceWidth` plus internal `FeatureQuery`, `position.mjs` and `substitution` logic described in a secondary code analysis. GSUB coverage is limited to seven type/format pairs and pair kerning, with no clusters, marks or vertical layout (secondary source, tagged).
- *Variation (verified from a detailed secondary code analysis).* `font.variation` (`VariationManager`) with `getDefaultCoordinates`, `getInstanceIndex`, `getInstance`, `set(index | {tag: value})`, stored in `defaultRenderOptions.variation`; `fvar`, `avar`, `STAT`, `gvar`, `cvar`, `HVAR` parsed; `getNormalizedCoords` applying avar segment maps; gvar tuple deltas applied to outline points; HVAR adjusts `advanceWidth`/`leftSideBearing`. **Tagged as secondary-source verification.**
- *Colour / bitmaps.* COLRv0 layers resolved through CPAL into per-layer filled `Path`s; SVG-table images as `_image` layers; no CBDT, no sbix, no COLRv1 paint graph (secondary source).
- *Writing.* `font.toArrayBuffer()`, `font.download()`, `font.toTables()`; `new opentype.Glyph({name, unicode, advanceWidth, path})`; `Font` constructed from scratch and serialised. GSUB `add*` builders exist (secondary source, **unverified exact names**).
- *WOFF2.* Not built in; the README instructs decompressing first with `wawoff2` (`Module.decompress(await buffer)`).

**Feature coverage.** TTF (`glyf`), OTF/CFF (PostScript outlines), WOFF, composite glyphs, `kern`/GPOS kerning, ligatures (`liga`, `rlig`), TrueType hinting (bytecode interpreter), SVG/COLR-CPAL colour glyphs (v0), variable fonts (fvar/gvar/avar/HVAR), and full read/write round-tripping. No TTC, no CFF2, no WOFF2 (without an external decompressor), no sbix/CBDT, no COLRv1, no bitmap strikes, no complex-script shaping, no vertical writing, no fallback, no rasteriser (drawing delegates to a Canvas 2D context), no SDF/LCD/atlas.

**Architectural stance.** Pure data model plus a path builder; every table is a plain JavaScript object, trivially inspectable, serialisable and editable. Glyphs are lazily decoded (`LazyGlyph.path` thunks, per a secondary analysis); the rest of the tables are decoded eagerly. Mutable shared state is a known weakness. Read and write share one object model. No I/O coupling beyond `ArrayBuffer` in and `ArrayBuffer` out plus optional Canvas drawing. Errors are ordinary JS exceptions.

**Suitability as a differential-test oracle.** Excellent. Pure JS, no native dependencies, fully offline under Node, deterministic in integer font units. Comparable outputs: `charToGlyph`/`stringToGlyphs` (glyph indices and unicodes), `glyph.advanceWidth`, `glyph.getBoundingBox()` (`x1/y1/x2/y2`), `font.getAdvanceWidth`, and especially `path.commands` — an `M/L/Q/C/Z` command stream in font units that is trivially serialised to golden JSON. `toArrayBuffer()` gives a byte-level round-trip check. Tolerance concerns: bounding boxes are control boxes (including off-curve control points) rather than tight ink boxes, so they must not be compared against `BoundsPen`-style tight bounds without conversion; also hinting and `fontSize` scaling introduce floating-point rounding.

**Worth stealing for moonfont.** The split between the unscaled `glyph.path` (font units, y-up) and the scaled, y-flipped `glyph.getPath(x, y, fontSize)` (device coordinates) is exactly right: keep outline-in-font-units and outline-at-size as two separate calls. Also, `Path.commands` as a plain array of `{type, x, y, x1, y1, x2, y2}` records is the simplest possible golden-file format for outline regression.

## 3.2 fontkit

- **Name / version / licence.** `fontkit` by Devon Govett (foliojs), used by PDFKit and pdf-lib; **MIT** licence (verified across several package listings). Version: a third-party synopsis reports `package.json` version **2.0.4** with the listed release **v2.0.0 (2022)**; maintained forks include `@cantoo/fontkit` **2.0.12**, `@pdf-lib/fontkit`, `@foliojs-fork/fontkit` (`1.9.1-alpha.4` for `@mormahr/foliojs-fontkit`). **Exact current upstream stable version unverified.**
- **Positioning.** An advanced font engine for Node and the browser: many container formats, GSUB/GPOS/AAT shaping, glyph paths, colour emoji and subsetting.
- **Source.** `https://www.npmjs.com/package/@pdf-lib/fontkit`; `https://fontkit.typogram.co/reference`; `https://libraries.io/npm/@cantoo%2Ffontkit`; `https://github.com/seek-oss/capsize` (which credits fontkit for metrics extraction).

**Public interface by concern**

- *Container (verified).* `fontkit.create(buffer, postscriptName = null)`, `fontkit.openSync(filePath, postscriptName)`, `fontkit.open(filePath, postscriptName, callback)` (some forks return a Promise from `open`); `fontkit/core` exports `create`, `registerFormat`, `registerShaper`, `defaultLanguage`, `setDefaultLanguage`, `logErrors`; format modules `fontkit/formats/TTFFont`, `WOFFFont`, `WOFF2Font`, `TrueTypeCollection`, `DFont`; shaper modules `DefaultShaper`, `UniversalShaper`, `ArabicShaper`, `IndicShaper`, `HangulShaper`, `HebrewShaper`, `MyanmarShaper`, `ThaiShaper`.
- *Collections (verified).* `collection.getFont(postscriptName)`, `collection.fonts` (lazily-loaded array).
- *Metadata / metrics (verified).* `postscriptName`, `fullName`, `familyName`, `subfamilyName`, `copyright`, `version`; `unitsPerEm`, `ascent`, `descent`, `lineGap`, `lineHeight`, `underlinePosition`, `underlineThickness`, `italicAngle`, `capHeight`, `xHeight`, `bbox`, `numGlyphs`, `characterSet`, `availableFeatures`.
- *Character mapping (verified).* `font.glyphForCodePoint(codePoint)`, `font.hasGlyphForCodePoint(codePoint)`, `font.glyphsForString(string)`, `font.widthOfGlyph(glyph_id)`, `font.getGlyph(glyph_id, codePoints = [])`.
- *Layout / shaping (verified).* `font.layout(string, features = [] | {})` returning a `GlyphRun` with `.glyphs` and `.positions`; `GlyphPosition` has `xAdvance`, `yAdvance`, `xOffset`, `yOffset`; OpenType feature tags map to AAT features on AAT fonts.
- *Variation (verified).* `font.variationAxes` (keys are 4-letter axis tags; values have `name`, `min`, `default`, `max`), `font.namedVariations`, `font.getVariation(variation)` returning a new font object.
- *Glyphs (verified).* `Glyph.id`, `codePoints`, `path`, `bbox` (tight bounding box), `cbox` (control box, faster but less accurate), `advanceWidth`, `glyph.render(ctx, size)`; `Path` with `moveTo`, `lineTo`, `bezierCurveTo`, `quadraticCurveTo`, `closePath`, `bbox`, `toSVG()`.
- *Colour glyphs.* Support for Apple `sbix` and Microsoft `COLR` verified at feature level; exact API **unverified**.
- *Subsetting / writing (verified).* `font.createSubset()` returning a `Subset`; `subset.includeGlyph(glyph)`, `subset.encodeStream()` (pipeable), and in `@cantoo/fontkit` `subset.encode()` (synchronous, returns a buffer).
- *Font collection objects.* `TTFFont` base class; all returned font objects inherit from it.

**Feature coverage.** TTF, OTF (TrueType `glyf` and PostScript CFF outlines), WOFF, WOFF2, TTC and Datafork TrueType (`.dfont`); GSUB and GPOS; AAT `morx` substitution; eight pluggable shapers (Arabic, Indic, Hangul, Hebrew, Myanmar, Thai, Universal, Default); kerning and OpenType positioning; glyph vector paths and SVG conversion; colour emoji via `sbix` and `COLR`; AAT variation fonts (`variationAxes`, `namedVariations`, `getVariation`); subsetting and font writing. No rasteriser (glyphs render to a supplied graphics context), no hinting, no SDF/LCD/atlas, no system font fallback. Tagged as AAT-first for variations, so OpenType `fvar` variable-font support is **unverified**.

**Architectural stance.** A pure-JS engine with pluggable format and shaper registries (`registerFormat`, `registerShaper`), lazy `collection.fonts`, and one `TTFFont`-derived API across all container formats. `Glyph` and `GlyphRun` are immutable value objects; the `Subset` is a builder that accumulates `includeGlyph` then `encode`. Errors are ordinary JS exceptions; `logErrors` is configurable. I/O is decoupled via buffers, with Node using native zlib and browsers using fflate/Brotli (verified from a repository synopsis).

**Suitability as a differential-test oracle.** Very good for shaping. `glyphForCodePoint`, `hasGlyphForCodePoint`, `widthOfGlyph`, `layout()` (`GlyphRun.glyphs` + `GlyphPosition` quadruples) and `glyph.bbox`/`cbox` are deterministic and comparable offline. The `bbox` versus `cbox` distinction (tight bounding box versus control box) is especially valuable because it gives two independent, well-defined boxes to test against. Tolerance concerns: AAT/OpenType shaper version differences and the fact that `cbox` includes off-curve control points.

**Worth stealing for moonfont.** `font.bbox` versus `font.cbox` / `glyph.bbox` versus `glyph.cbox`: two explicitly named boxes with a documented accuracy/speed trade-off. Combined with `layout()` returning a `GlyphRun` of glyphs plus a parallel `positions` array of `{xAdvance, yAdvance, xOffset, yOffset}`, this is the cleanest shaped-run shape in the JS ecosystem. Also worth copying: the pluggable `registerFormat`/`registerShaper` registry with tree-shakeable subpath imports (`fontkit/core`, `fontkit/formats/*`, `fontkit/shapers/*`).

## 3.3 Typr.js / Typr.ts

- **Name / version / licence.** `Typr.js` by the Photopea author; TypeScript port `Typr.ts` / npm `typr-ts`. **Licence unverified** (not stated on the consulted README); **version unverified**. It is the main text engine of the Photopea image editor.
- **Positioning.** A deliberately tiny (roughly 60–70 kB), very fast, procedural TTF/OTF parser and shaper with no classes or constructors.
- **Source.** `https://github.com/meiling413code/Typr.js`; `https://github.com/lojjic/Typr.ts/tree/feature/package`; `http://github.chaintip.org/lTyl/Typr.ts`.

**Public interface by concern (verified)**

- *Container.* `Typr.parse(buffer)` returns a font object (or, in newer variants, an array of font objects for TTC). The object is "a set of tables, each table has its own structure", mirroring the SFNT table directory (`font.head.unitsPerEm` is named in the README). `Typr.U.SVG` for SVG-font utilities.
- *Character mapping.* `Typr.U.codeToGlyph(font, code)` → glyph index, `Typr.U.stringToGlyphs(font, str)` → array of glyph indices with mandatory substitutions and ligatures, `Typr.U.hasGlyphForCodePoint` (**unverified**).
- *Shaping.* `Typr.U.shape(font, str, ltr)` (older) and `Typr.U.shape(font, str, prm)` (newer, with `prm = {ltr, fts, axs}`); returns an array of elements `{g: glyph index, cl: cluster index, ax, ay: advance, dx, dy: pen offset}`. `Typr.U.getPairAdjustment(font, gid1, gid2)` for kerning.
- *Glyph outlines.* `Typr.U.glyphToPath(font, gid[, ignoreColor, axs])`, `Typr.U.glyphsToPath(font, gls)`, `Typr.U.shapeToPath(font, shape)`. Paths are `{cmds: [CMD, ...], crds: [X, Y, ...]}` with commands `"M"` (2 coords), `"L"` (2), `"Q"` (4), `"C"` (6), `"Z"` (0), `"#rrggbb"` (0, SVG colour), `"X"` (0, fill). All paths are in font units (`font.head.unitsPerEm`); scaling is left to the caller.
- *Rendering / serialisation.* `Typr.U.pathToContext(path, ctx)`, `Typr.U.pathToSVG(path)`; `Typr.U.stringToContext` is given as a user-extension example, not a built-in.
- *TypeScript port.* `import { TyprU } from "typr-ts"`, with the same functions as static methods (`TyprU.codeToGlyph`, `TyprU.stringToGlyphs`, `TyprU.getPairAdjustment`, `TyprU.glyphToPath`, `TyprU.glyphsToPath`, `TyprU.pathToContext`, `TyprU.pathToSVG`).

**Feature coverage.** TTF/OTF, TTC (array return in newer variants), SVG colour fonts (via the `"#rrggbb"`/`"X"` path commands), GSUB mandatory substitutions and ligatures, GPOS pair adjustment (`getPairAdjustment`), variable axes via `axs` in `shape`/`glyphToPath` (partial), and LTR/RTL via the `ltr` parameter. No WOFF/WOFF2 (unverified), no bitmap strikes, no COLR/CPAL, no sbix, no hinting, no rasteriser, no subsetting, no font writing, no SDF/LCD/atlas/fallback.

**Architectural stance.** The most extreme data-oriented design in the survey: "static functions only ... no constructors, no methods, no complex structure", explicitly designed to be portable to C or any procedural language. The font object is a plain bag of table objects. Paths are flat parallel arrays of command strings and coordinates. I/O is a single `ArrayBuffer`; no error model is documented (**unverified**).

**Suitability as a differential-test oracle.** Excellent for outlines and shaping, and unusually easy to script. `Typr.U.codeToGlyph` and `stringToGlyphs` give integer glyph ids; `shape()` gives glyph ids, cluster indices, advances and offsets; `glyphToPath` gives a `{cmds, crds}` stream that is trivially diffable; `getPairAdjustment` gives kerning values. All in integer font units, fully offline, no native dependencies. Tolerance concerns: the command vocabulary is coarser than fontTools' pen protocol (quadratic `"Q"` and cubic `"C"` only), and SVG-colour commands (`"#"`, `"X"`) must be normalised before comparison.

**Worth stealing for moonfont.** The `{cmds: string[], crds: number[]}` flat-path representation. It is the leanest possible outline value type, trivially serialisable, trivially transformable (apply an affine transform to `crds` directly), and language-neutral — a natural fit for a MoonBit `Path { commands, coordinates }` struct. Paired with a `shape()` that returns `{g, cl, ax, ay, dx, dy}` records, it gives a complete, comparable layout result in one call.

## 3.4 harfbuzzjs

- **Name / version / licence.** `harfbuzzjs`, a WebAssembly build of HarfBuzz for JavaScript/TypeScript. **Version and licence unverified** from the consulted sources (upstream HarfBuzz is MIT-licensed, but that is not verified for the JS packaging here).
- **Positioning.** A shaping-only WASM module; it consumes font bytes and a Unicode buffer and emits positioned glyphs. It does not parse outlines for drawing or rasterise.
- **Source.** Primary sources did not surface in this survey; the HarfBuzz C API documentation at `https://harfbuzz.github.io/a-simple-shaping-example.html` documents the underlying model. **API names below are unverified for the JS wrapper specifically.**

**Public interface by concern (unverified)**

- The wrapper is known to expose a `hbjs`-style facade over `hb_blob_create`, `hb_face_create`, `hb_font_create`, `hb_buffer_create`, `hb_buffer_add_utf8`, `hb_buffer_guess_segment_properties`, `hb_shape`, `hb_buffer_get_glyph_infos`, `hb_buffer_get_glyph_positions`, `hb_buffer_serialize_glyphs`, and font `set_variations`/`scale`/`ppem` setters. The exact JS names (`hbjs.createBlob`, `createFace`, `createFont`, `createBuffer`, `shape`, `glyphInfos`, `glyphPositions`) are **unverified** and should be confirmed against the package README before use.

**Feature coverage.** Shaping only: GSUB, GPOS, script/language/direction handling, variable-font axes, vertical writing and (in recent HarfBuzz) subsetting. All container parsing, outlines, metrics tables, rasterisation, colour glyphs and font writing are out of scope.

**Architectural stance.** A WASM black box with an explicit `Face`/`Font`/`Buffer` triad, mirroring HarfBuzz's C objects; deterministic and offline. Errors and memory management follow the WASM binding (allocation/free), **unverified**.

**Suitability as a differential-test oracle.** Potentially excellent for shaping (HarfBuzz is the de facto reference shaper, and the WASM build is hermetic and deterministic), but the unverified JS API makes it a poor *first* choice. It is best used through `uharfbuzz` (Python) or the C API, where the identifiers are verified.

**Worth stealing for moonfont.** HarfBuzz's `Buffer` as a caller-owned, reusable object: set text and properties, shape, read glyph infos and positions back, and clear with `clear_contents()` while keeping properties. This buffer-reuse pattern avoids per-shaping-run allocation and is worth mirroring.

## 3.5 fonteditor-core

- **Name / version / licence.** `fonteditor-core` by kekee000 / the Fonteditor project; **MIT** licence (verified from the README, which carries the standard MIT notice). Version **2.1.8** observed on unpkg; a repository snapshot is dated 2026-10-05. **Current stable version unverified.**
- **Positioning.** A JavaScript sfnt reader/writer/transformer focused on font editing: TTF, WOFF, WOFF2, EOT, SVG and OTF (read/convert), with glyph adjustment.
- **Source.** `https://github.com/kekee000/fonteditor-core`; `https://app.unpkg.com/fonteditor-core@2.1.8/files/README.md`.

**Public interface by concern (verified)**

- *Container.* Legacy `Font.create(buffer, options)` and current named export `createFont(buffer, options)`; options `type` (`ttf`, `woff`, `woff2`, `eot`, `otf`, `svg`), `subset` (array of code points), `hinting`, `kerning`, `compound2simple`, `inflate`, `combinePath`, `deflate`, `support`. `font.get()` returns the plain font object whose keys are `version`, `numTables`, `searchRenge`, `entrySelector`, `rengeShift`, `head`, `maxp`, `glyf`, `cmap`, `name`, `hhea`, `post`, `OS/2`, `fpgm`, `cvt`, `prep` (the README preserves the misspellings `searchRenge`/`rengeShift`, quoted here verbatim).
- *Writing.* `font.write({type, hinting, kerning, writeZeroContoursGlyfData, deflate, support})`, `font.toBase64({type})`.
- *Glyph editing.* `font.optimize()`, `font.compound2simple()`, `font.sort()`, `font.find({unicode})`, `font.find({filter})`, `font.merge(font1, {scale})`.
- *WOFF2.* Named export `woff2` with `woff2.init()` (Node) and `woff2.init('/assets/woff2.wasm')` (browser), returning a Promise; a WASM build of Google's woff2 codec. Reading and writing WOFF2 require `type: 'woff2'` after initialisation.

**Feature coverage.** Read/write TTF, WOFF, WOFF2, EOT, SVG; read and convert OTF (CFF to TTF — verified as "otf (only read and convert to ttf)"); hinting-table preservation (`fpgm`, `cvt`, `prep`); kerning-table preservation; compound-to-simple glyph conversion; per-code-point subsetting on read; glyph optimisation, sorting, finding and merging. No shaping, no colour glyph tables, no variable fonts, no rasterisation, no SDF/LCD/atlas/fallback. CFF2 and TTC **unverified**.

**Architectural stance.** A mutable editor: `createFont` parses into a plain JS object, `get()` exposes it, `write()` re-serialises it. Table data is fully materialised and directly editable. I/O is decoupled (ArrayBuffer/Buffer in, Buffer/ArrayBuffer/base64 out); WOFF2 is an explicitly initialised WASM dependency. Errors **unverified**.

**Suitability as a differential-test oracle.** Good for round-trip and table-level testing. `font.get()` gives a fully inspectable table object (`head`, `maxp`, `glyf`, `cmap`, `hhea`, `OS/2`), and `font.write()`/`toArrayBuffer`-equivalent output can be hashed. It is particularly useful for verifying that a font compiler produces bytes that another reader can parse. Tolerance concerns: the `subset` option is code-point based, and WOFF2 output depends on the pinned WASM codec.

**Worth stealing for moonfont.** The `subset` option at *parse time* — letting the caller declare which code points it cares about so the parser never materialises the rest. Combined with `font.get()` returning a plain table bag and `font.write()` re-serialising it, this is a cheap, honest read/modify/write loop. The `hinting`/`kerning` boolean preservation flags are also a nice explicit touch.

## 3.6 capsize (`@capsizecss/core`)

- **Name / version / licence.** `capsize` by SEEK (`@capsizecss/core`, `@capsizecss/metrics`, `@capsizecss/unpack`, `@capsizecss/vanilla-extract`); **MIT** licence (verified). **Version unverified.**
- **Positioning.** A CSS typography library that uses font metrics to size text by cap height and trim the whitespace above capitals and below the baseline; it is a metrics *consumer*, not a font parser (parsing is delegated to `@capsizecss/unpack`, which uses fontkit).
- **Source.** `https://github.com/seek-oss/capsize`; `https://seek-oss.github.io/capsize/`.

**Public interface by concern (verified)**

- *Style generation.* `createStyleObject({fontSize | capHeight, leading | lineGap, fontMetrics})` → CSS-in-JS object; `createStyleString(className, options)` → CSS string; `createFontStack([metrics, ...])` → `{fontFamily, fontFaces}` with `ascent-override`, `descent-override`, `line-gap-override` and `size-adjust` `@font-face` declarations for metric-matched fallbacks.
- *Low-level metrics.* `precomputeValues({fontSize, fontMetrics})` → `{fontSize, lineHeight, capHeightTrim, baselineTrim}`; `getCapHeight({fontSize, fontMetrics})` → number.
- *Metrics shape.* `fontMetrics` is `{capHeight, ascent, descent, lineGap, unitsPerEm}`; imports from `@capsizecss/metrics/arial` etc., or `fromFile(filePath)` / `fromUrl(...)` from `@capsizecss/unpack` (**`fromUrl` unverified**).

**Feature coverage.** Consumes exactly five metrics from the font's `head`/`hhea`/`OS/2`/`post` tables; produces CSS. Metric-matched font fallback stacks (`createFontStack`) are the one font-related feature beyond measurement. No parsing of glyphs, outlines, cmap or layout tables; no writing of font binaries.

**Architectural stance.** A pure functional library: metrics in, CSS strings/out. Stateless, immutable, no I/O in the core package (file/URL reading is in the separate `@capsizecss/unpack` package). Errors are ordinary JS/TS exceptions.

**Suitability as a differential-test oracle.** Poor as a primary oracle, but excellent as a *consumer* of a very small, well-defined metric set. It is a good target for testing whether a MoonBit library's `capHeight`, `ascent`, `descent`, `lineGap` and `unitsPerEm` are correct: feed them into `precomputeValues` and compare the CSS output. Fully offline and deterministic.

**Worth stealing for moonfont.** The `fontMetrics = {capHeight, ascent, descent, lineGap, unitsPerEm}` value type. Five numbers, one named struct, no font object required — a beautiful minimal API for vertical metrics that a latecomer library should expose as a first-class `FontMetrics` record. Also `createFontStack`'s metric-matched fallback idea (via `ascent-override`/`size-adjust`) is a cheap way to reduce layout shift.

## 3.7 Canvas `TextMetrics` and `CanvasRenderingContext2D.measureText`

- **Name / version / licence.** The HTML Canvas 2D API, a W3C/WHATWG web standard implemented by browsers; no standalone version or licence.
- **Positioning.** The browser's own text measurement and rasterisation surface — the reference against which JS font libraries are usually compared (`Font.getAdvanceWidth` explicitly "corresponds to canvas2dContext.measureText(text).width", verified).
- **Source.** `https://developer.mozilla.org/` (standard reference; the specific equivalence is quoted in the opentype.js README at `https://github.com/opentypejs/opentype.js`).

**Public interface by concern (partly unverified against a primary standard page)**

- `CanvasRenderingContext2D.measureText(text)` returning a `TextMetrics` object; `TextMetrics.width`, `actualBoundingBoxLeft`, `actualBoundingBoxRight`, `actualBoundingBoxAscent`, `actualBoundingBoxDescent`, `fontBoundingBoxAscent`, `fontBoundingBoxDescent`, `emHeightAscent`, `emHeightDescent`, `hangingBaseline`, `alphabeticBaseline`, `ideographicBaseline`; `CanvasRenderingContext2D.font`, `textAlign`, `textBaseline`, `direction`, `fontKerning`, `fontStretch`, `fontVariantCaps`, `textRendering`, `wordSpacing`, `letterSpacing`, `fillText`, `strokeText`. **Exact property set unverified** against a primary standard page in this survey, though the `actualBoundingBox*` and `fontBoundingBox*` families are widely documented.
- Font loading is via CSS `@font-face` / `FontFace` / `document.fonts`, which handles WOFF and WOFF2 natively.

**Feature coverage.** Whatever the browser supports: TTF/OTF/WOFF/WOFF2, system font fallback, kerning, complex-script shaping, bidi, vertical text, LCD/subpixel and ClearType-style rendering, and glyph atlas caching inside the browser. The JS API exposes only measurement and drawing, not cmap, outlines, tables or font bytes.

**Architectural stance.** An opaque, platform-owned renderer. Fully stateful (context properties), no font object exposed, no deterministic data model. I/O coupled to the DOM and the OS font stack. No error model beyond exceptions for invalid fonts.

**Suitability as a differential-test oracle.** Poor for hermetic testing. `measureText().width` is floating-point, device- and browser-dependent, and font discovery is OS-dependent. It is valuable only as the semantic *definition* of "advance width" and as a browser-integration target, not as a golden oracle. Its `actualBoundingBox*` versus `fontBoundingBox*` distinction is conceptually worth copying.

**Worth stealing for moonfont.** The four `actualBoundingBox*` values plus `width` on the measurement result: a single `measureText` call that returns advance *and* ink extents in one value object, with explicit "actual" (ink) versus "font" (logical) naming. This is the same lesson as Java2D's logical/visual split, expressed more compactly.

## 3.8 WOFF2 handling (wawoff2, fonteditor-core `woff2`, Google woff2, `@capsizecss/unpack` etc.)

- **Name / version / licence.** WOFF2 (W3C Recommendation, March 2018) uses Brotli compression. Tooling: Google's `woff2` C library (`sfnt2woff`/`woff2_decompress`), `wawoff2` (Emscripten/WASM build, version **2.0.1** named in the opentype.js README), `fonteditor-core`'s `woff2` export, and native support in SixLabors.Fonts, fontkit and fontTools (the latter requires the `brotli` optional dependency). **Licences unverified** for individual wrappers.
- **Positioning.** A compression/transport layer, not a font model: it converts WOFF2 bytes to/from plain SFNT bytes so an existing parser can read them.
- **Source.** `https://github.com/opentypejs/opentype.js` (wawoff2 usage); `https://app.unpkg.com/fonteditor-core@2.1.8/files/README.md` (`woff2.init()`); `https://www.w3.org/` (WOFF2 specification — referenced by secondary sources).

**Public interface by concern (verified)**

- `opentype.js` path: `Module.decompress(buffer)` from `wawoff2` (`https://unpkg.com/wawoff2@2.0.1/build/decompress_binding.js`), then `opentype.parse(Module.decompress(await buffer))`.
- `fonteditor-core` path: `woff2.init()` (Node) / `woff2.init('/assets/woff2.wasm')` (browser), then `createFont(buffer, {type: 'woff2'})` and `font.write({type: 'woff2'})`.
- `OpenFontSharp` path: `Woff2Converter.ToSfnt` with host-supplied Brotli (verified).
- `fontTools` path: WOFF2 read/write via the optional `brotli` module (verified at feature level; exact API **unverified**).
- SixLabors.Fonts and fontkit handle WOFF2 transparently inside `Add(...)`/`create(...)`.

**Feature coverage.** WOFF2 decompression and recompression only. Note the opentype.js README's explicit engineering rationale: bundling Brotli would grow the library from roughly 120 kB to roughly 1400 kB, so decompression is deliberately kept out of the parser.

**Architectural stance.** A clean layering decision: keep the codec out of the font object model. Readers accept `ArrayBuffer`; codecs are explicitly initialised (WASM) or supplied as `inflate`/`deflate` callbacks (`fonteditor-core`). This keeps the core parser small and testable.

**Suitability as a differential-test oracle.** Not an oracle itself, but a *precondition*: WOFF2 support is best verified by decompressing to SFNT bytes and hashing, then feeding the same bytes to two different parsers. Deterministic given a pinned Brotli build.

**Worth stealing for moonfont.** Keep Brotli/WOFF2 as a separate, optional, explicitly initialised codec layer that yields plain SFNT bytes. Never let a compression format leak into the table model. The `inflate`/`deflate` callback injection in `fonteditor-core` is a particularly nice way to make the codec pluggable without a hard dependency.

## 3.9 opentype-feature-freeze

- **Name / version / licence.** `opentype-feature-freeze` (a JS tool that applies a chosen OpenType GSUB feature to a font and writes out a derived static font, commonly used to bake programming-ligature features such as `calt`/`liga` into a font). **Version, licence and exact API unverified** — primary sources did not surface in this survey.
- **Positioning.** A font *transformation* tool at the intersection of shaping and font writing: it resolves GSUB substitutions ahead of time and emits a new font whose default glyph mapping already includes the chosen feature.
- **Source.** **Unverified / not confirmed** against a primary repository in this survey.

**Public interface by concern (unverified)**

- The conventional CLI/API shape is a function taking a font buffer, a feature tag and output options, and returning modified font bytes, built on top of `opentype.js`'s `Font`/`Glyph`/`toArrayBuffer` model. **Exact identifiers are unverified and must not be relied upon.**

**Feature coverage.** GSUB feature application and font writing; no rasterisation, no metrics API, no colour/variable/WOFF handling (all **unverified**).

**Architectural stance.** A compile-time alternative to run-time shaping: instead of applying features during layout, bake them into the font. This is conceptually important even though the concrete API is unverified.

**Suitability as a differential-test oracle.** Poor, due to unverified API. Conceptually useful as a reminder that "shaping" and "font compilation" can be traded off.

**Worth stealing for moonfont.** The idea, not the identifier: expose a `bakeFeature(font, featureTag)`-style operation that resolves a GSUB feature into a new font with a rewritten cmap. This gives consumers without a shaper access to ligatures and is a strong differentiator for a latecomer library.

---

# 4. Python ecosystem

## 4.1 fontTools

- **Name / version / licence.** `fontTools` (fonttools on PyPI); **MIT** licence (verified from the official docs: "fontTools is licensed under the MIT open-source license"). Requires **Python 3.11 or later** (verified). Version **4.47.2** observed in a 2023 third-party OSS inventory; **current stable version unverified**. No dependencies beyond the standard library; optional extras enable WOFF2 (`brotli`), `lxml`, `zopfli`, `skia-pathops`, etc.
- **Positioning.** The canonical Python library for reading, writing, parsing and manipulating font binaries; a family of libraries and CLI tools rather than a single class.
- **Source.** `https://fonttools.readthedocs.io/`; `https://github.com/fonttools/fonttools`; `https://deepwiki.com/fonttools/fonttools/1-overview`.

**Public interface by concern**

- *Container / table access (verified).* `from fontTools.ttLib import TTFont`; `TTFont(path)`, `TTFont(fileobj)`, `font.keys()`, `font[tag]` (e.g. `font['cmap']`, `font['glyf']`, `font['hmtx']`, `font['head']`, `font['hhea']`, `font['loca']`, `font['maxp']`, `font['name']`, `font['OS/2']`, `font['post']`, `font['GSUB']`, `font['GPOS']`, `font['fvar']`, `font['gvar']`, `font['COLR']`, `font['CPAL']`, `font['sbix']`, `font['SVG ']`, `font['CFF ']`, `font['CFF2']`); `font.save(path)`, `font.save(fileobj)`, `font.close()`, `font.getGlyphOrder()`, `font.getGlyphName(id)`, `font.getGlyphID(name)`, `font.getBestCmap()`, `font.getGlyphSet()`, `font.getReverseGlyphMap()`, `font.getTableData(tag)`, `font.reader`, `font.recalcBBoxes`, `font.recalcTimestamp`, `font.flavor` (WOFF/WOFF2), `TTCollection` for TTC (`fontTools.ttLib.TTCollection`, `fonts` attribute), `newTable(tag)`, `font.ensureDecompiled()`. Table classes live in `fontTools.ttLib.tables` as `_c_m_a_p.table__c_m_a_p`, `_g_l_y_f.table__g_l_y_f`, `_h_m_t_x.table__h_m_t_x`, `_h_e_a_d.table__h_e_a_d`, `_h_h_e_a.table__h_h_e_a`, `_l_o_c_a.table__l_o_c_a`, `_m_a_x_p.table__m_a_x_p`, `_n_a_m_e.table__n_a_m_e`, `_O_S_2f_2.table__O_S_2f_2`, `_p_o_s_t.table__p_o_s_t`, `_G_S_U_B.table__G_S_U_B`, `_G_P_O_S.table__G_P_O_S`, `_f_v_a_r.table__f_v_a_r`, `_g_v_a_r.table__g_v_a_r`, `_C_O_L_R.table__C_O_L_R`, `_C_P_A_L.table__C_P_A_L`, `_s_b_i_x.table__s_b_i_x`, `_S_V_G_.table__S_V_G_`, `C_F_F_.table__C_F_F_`, `C_F_F_2.table__C_F_F_2` (**exact module/class spellings verified for `cmap`, `glyf`, `name`, `loca` from the DeepWiki code map; the rest follow the same convention and are tagged partly unverified**).
- *Character mapping.* `font.getBestCmap()` (preferred Unicode cmap as `{codepoint: glyphName}`), `cmapTable.cmap` dict keyed by `(platformID, platEncID, language, format)`, `CmapSubtable` `.cmap`, `.getGlyphName()`, `.getCmap()`, `.setCmap()`, `cmap format 4/6/12` classes, `fontTools.ttLib.tables._c_m_a_p.CmapSubtable.newSubtable(format)`.
- *Glyph outlines / pens (verified).* `glyphSet = font.getGlyphSet()`, `glyphSet["A"].draw(pen)`. Pen protocol in `fontTools.pens`: `BasePen` (with `_moveTo`, `_lineTo`, `_curveToOne`, `_qCurveToOne`, `_closePath`, `_endPath`, `addComponent`, plus public `moveTo`, `lineTo`, `curveTo`, `qCurveTo`, `closePath`, `endPath`, `addComponent`), `RecordingPen` (records `value` as a list of `(op, args)` tuples), `DecomposingRecordingPen`, `SVGPathPen` (`getCommands()`), `BoundsPen` (`bounds`), `ControlBoundsPen` (`controlBounds` — the control box), `TransformPen` (`TransformPen(otherPen, transformation)`), `TTGlyphPen` (`TTGlyphPen(glyphSet)`, `.glyph()`), `T2CharStringPen`, `Cu2QuPen`, `Qu2CuPen`, `RoundingPen`, `FilterPen`, `ReverseContourPen`, `StatisticsPen` (`area`, `meanX`, `meanY`, `moments`), `PerContourPen`, `TeePen`, `NullPen`, `GlyphObject` protocol. Also `fontTools.pens.basePen.BasePen` and `fontTools.pens.recordingPen.RecordingPen`.
- *Metrics.* `font['hmtx'].metrics` (dict `glyphName -> (advanceWidth, lsb)`), `font['hmtx'].getAdvance(glyphName)`, `font['head'].unitsPerEm`, `xMin`, `yMin`, `xMax`, `yMax`, `font['hhea'].ascent`, `descent`, `lineGap`, `advanceWidthMax`, `numberOfHMetrics`, `font['OS/2'].sTypoAscender`, `sCapHeight`, `sxHeight`, `usWinAscent`, `usWinDescent`, `font['post'].italicAngle`, `font['vmtx']`, `font['vhea']`.
- *Layout / shaping.* `fontTools.feaLib` (compile `.fea` feature files into GSUB/GPOS: `fontTools.feaLib.builder.addOpenTypeFeatures(font, featurefile)`, `Builder`), `fontTools.varLib` (`buildVariations`, `load_designspace`, `buildVF`), `fontTools.varLib.instancer` (`instantiateVariableFont(font, axisLimits, inplace=False, optimize=True)`, `instantiatePartialVariableFont`, `parseLimits`, `normalizeAxisLimits`, `limitFontVariation`), `fontTools.varLib.models` (`VariationModel`, `normalizeValue`, `supportScalar`), `fontTools.designspaceLib` (`DesignSpaceDocument`, `AxisDescriptor`, `SourceDescriptor`, `InstanceDescriptor`, `RuleDescriptor`), `fontTools.otlLib.builder` (`buildStatTable`, `buildGSUB`, `buildGPOS`, `buildCmapSubtable`, `buildAnchor`, `buildLookup`, `buildSingleSubstSubtable`, `buildPairPosClassesSubtable`), `fontTools.otlLib.maxContextCalc`, `fontTools.gsubgpos` / `fontTools.otlLib.optimize`.
- *Colour / bitmaps.* `fontTools.colorLib` (`COLRPalette`, `buildCPAL`, `Color`, `parseColor`, `colrCpal`), `fontTools.ttLib.tables._C_O_L_R` (COLRv0 `ColorLayers`, COLRv1 paint graph `table__C_O_L_R` `ColorGlyphs`), `CPAL`, `sbix`, `CBDT`/`CBLC`, `EBDT`/`EBLC`/`EBSC`, `SVG ` table, `fontTools.svgLib.path` (`parse_path`, `SVGPath`, `parseSVG`).
- *Subsetting / writing (verified).* `fontTools.subset` (`Subsetter`, `Options`, `subsetter.populate(unicodes=..., glyphs=..., text=...)`, `subsetter.subset(font)`, `font.save(...)`); CLI `pyftsubset`, `pyftmerge`, `ttx`, `fonttools varLib.instancer`, `fonttools ttx`, `fonttools subset`, `fonttools merge`, `fonttools cu2qu`, `fonttools feaLib`, `fonttools voltLib.voltToFea`, `fonttools cffLib.width`. `fontTools.fontBuilder.FontBuilder` (`setupGlyphOrder`, `setupCharacterMap`, `setupGlyf`, `setupHorizontalMetrics`, `setupHorizontalHeader`, `setupNameTable`, `setupOS2`, `setupPost`, `setupCFF`, `setupFvar`, `setupGvar`, `setupCOLR`, `setupCPAL`, `save`), `fontTools.merge.Merger`, `fontTools.ttx` (`ttx` / `TTXCompiler`), `fontTools.cffLib` (`CFFFontSet`, `CharStrings`), `fontTools.cu2qu` (`fonts_to_quadratic`, `font_to_quadratic`), `fontTools.ufoLib`, `fontTools.agl`, `fontTools.encodings`, `fontTools.unicodedata` (`script`, `script_horizontal_direction`, `script_vertical_direction`, `ot_tag_to_script`, `script_to_ot_tag`), `fontTools.voltLib`, `fontTools.ttLib.woff2` (optional brotli), `fontTools.ttLib.sfnt` (`SFNTReader`, `SFNTWriter`, `calcChecksum`).

**Feature coverage.** The broadest in this survey: TTF (`glyf`), OTF/CFF (`CFF `), CFF2, TTC (`TTCollection`), WOFF and WOFF2 (with optional brotli), embedded bitmap strikes (`EBDT`/`EBLC`/`EBSC`, `CBDT`/`CBLC`), `sbix`, COLR/CPAL v0 and v1 paint graphs, OpenType SVG table, variable fonts (`fvar`, `gvar`, `cvar`, `avar`, `HVAR`, `MVAR`, `VVAR`, `STAT`, `varLib`, `varLib.instancer`), hinting (`fpgm`, `prep`, `cvt `, `glyf` instructions, cu2qu), GSUB/GPOS compilation via `feaLib` and `otlLib`, vertical metrics (`vhea`, `vmtx`, `VORG`), subsetting (`fontTools.subset`, `pyftsubset`), merging (`fontTools.merge`), and full font writing/compiling (`TTFont.save`, `FontBuilder`, `ttx`). No rasterisation (that is FreeType/Pillow's job), no SDF, no LCD/subpixel, no glyph atlas, no font fallback/matching.

**Architectural stance.** Pure data model with lazy, cached table decompilation (`font[tag]` triggers decompile on first access; `font.ensureDecompiled()` forces it; `lazy=` options exist). Tables are mutable Python objects; `save()` recompiles them. I/O is decoupled via file paths and file objects. The **Pen Protocol** is the central abstraction: drawing operations (`moveTo`, `lineTo`, `curveTo`, `qCurveTo`, `closePath`, `addComponent`) are decoupled from storage (`glyf` quadratic vs CFF cubic), so one glyph can drive `BoundsPen`, `ControlBoundsPen`, `SVGPathPen`, `RecordingPen`, `TransformPen`, `TTGlyphPen`, `StatisticsPen`, etc. Errors are ordinary Python exceptions (`TTLibError`, `TTLibFileIsCollectionError`, `feaLib.error.FeatureLibError` — **exact names partly unverified**).

**Suitability as a differential-test oracle.** The best primary oracle available. Pure Python, standard-library only for the core, fully offline, deterministic, and it exposes every comparable quantity: `getBestCmap()` for character mapping, `hmtx.metrics` for integer advance widths, `BoundsPen.bounds` and `ControlBoundsPen.controlBounds` for two well-defined bounding boxes, `RecordingPen.value` and `SVGPathPen.getCommands()` for outline command streams, and `TTFont.save()`/`ttx` for byte/XML round-trips. Tolerance concerns: `BoundsPen` computes a tight (flattened) box while `ControlBoundsPen` includes off-curve control points — compare like with like; quadratic versus cubic contour conversion (`qCurveTo` with implied on-curve points) must be normalised; `getBestCmap()` picks one subtable by preference, so cmap selection must be pinned.

**Worth stealing for moonfont.** The Pen Protocol, without question. Define a `Pen` trait with `moveTo/lineTo/curveTo/qCurveTo/closePath/endPath/addComponent`, make every glyph expose `draw(pen)`, and ship a family of pens (recording, bounds, control-bounds, SVG, transform, statistics, glyph-builder). One decoder, arbitrarily many consumers. Second: lazy table access (`font[tag]` decompiles on first use), and third: `getBestCmap()` as a single, well-named convenience over a maze of cmap subtables.

## 4.2 Pillow / PIL `ImageFont`

- **Name / version / licence.** `Pillow` (the maintained PIL fork), `PIL.ImageFont` module; **HPND / MIT-CMU-style Pillow licence** (verified as permissive; exact SPDX **unverified**). Version **13.0.0** observed in a comprehensive API reference; **current stable unverified**. Requires the `_imagingft` FreeType service and optionally libraqm.
- **Positioning.** A rasterisation-and-measurement API for drawing text into images; font parsing is delegated to FreeType (and shaping to libraqm/HarfBuzz via the RAQM layout engine).
- **Source.** `https://pillow.readthedocs.io/en/stable/_modules/PIL/ImageFont.html`; `https://pillow.readthedocs.io/en/stable/reference/ImageFont.html`; `https://pillowpython.com/reference/imagefont`.

**Public interface by concern (verified)**

- *Module functions.* `ImageFont.load(filename)`, `load_default(size=None)`, `load_default_imagefont()`, `load_path(filename)`, `truetype(font, size=10, index=0, encoding="", layout_engine=None)`.
- *Classes.* `ImageFont`, `FreeTypeFont(font=None, size=10, index=0, encoding="", layout_engine=None)`, `BaseImageFont`, `TransposedFont`, `Axis` (TypedDict: `minimum`, `default`, `maximum`, `name`), `Layout` enum (`BASIC`, `RAQM`).
- *FreeTypeFont methods.* `font_variant(font=None, size=None, index=None, encoding=None, layout_engine=None)`, `get_variation_axes()`, `get_variation_names()`, `getbbox(text, mode='', direction=None, features=None, language=None, stroke_width=0, anchor=None)` → `(left, top, right, bottom)`, `getlength(text, mode='', direction=None, features=None, language=None)` → float (1/64 px precision), `getmask(text, mode='', direction=None, features=None, language=None, stroke_width=0, anchor=None, ink=0, start=None)` → coverage mask, `getmask2(...)` → `(mask, offset)`, `getmetrics()` → `(ascent, descent)`, `getname()` → `(family, style)`, `set_variation_by_axes(axes)`, `set_variation_by_name(name)`.
- *Legacy / base.* `getsize` (deprecated), `getbbox`, `getlength`, `getmask` on `ImageFont`; `ImageDraw.text`, `textbbox`, `textlength`, `multiline_text`, `multiline_textbbox`; `ImageText.Text` (`wrap`, `embed_color`) in newer Pillow (verified in a third-party reference, tagged secondary). `truetype` accepts `mode`, `direction`, `features`, `language`, `stroke_width`, `anchor` and layout engine `Layout.RAQM` / `Layout.BASIC`.

**Feature coverage.** TTF/OTF/TTC (via `index`), embedded bitmaps through FreeType, colour emoji (`embed_color`), variable fonts (`get_variation_axes`, `get_variation_names`, `set_variation_by_axes`, `set_variation_by_name`), kerning and OpenType features via the RAQM/HarfBuzz layout engine (`features`, `language`, `direction` with `rtl`/`ltr`/`ttb`), vertical writing (`ttb`), raster coverage masks (`getmask`/`getmask2`), and 1/64-pixel advance precision (`getlength`). No WOFF/WOFF2, no cmap/table access, no font writing, no subsetting, no SDF. Hinting and LCD/subpixel behaviour are inherited from FreeType/libraqm and are not directly configurable at this level.

**Architectural stance.** A renderer wrapper: `FreeTypeFont` is a stateful handle holding a size, an index, a layout engine and (for variable fonts) axis settings. `getmask` returns a core image object (a coverage bitmap), not a font structure. I/O coupled to file paths/file objects and the native FreeType/raqm libraries. Errors: `OSError` for missing/invalid fonts and non-variable-font axis calls, `ValueError` for invalid sizes.

**Suitability as a differential-test oracle.** Very good for rasterisation and measurement. `getbbox` (ink box), `getlength` (advance at 1/64 px), `getmetrics` (ascent/descent), `getmask`/`getmask2` (coverage bitmap) and `get_variation_axes` are all directly comparable, pure-function outputs. Tolerance concerns: results depend on the bundled FreeType version, the presence of libraqm, hinting, `stroke_width`, `anchor`, and `mode`/`direction`; `getbbox` returns floats for some paths. Pin the Pillow wheel to get reproducibility.

**Worth stealing for moonfont.** `getlength` semantics — "the amount by which the following text should be offset", at 1/64-pixel precision — is the clearest definition of an advance width in any surveyed API, and it is deliberately distinct from `getbbox` (ink box). Also `getmask2` returning `(mask, offset)` explicitly acknowledges that a rasterised glyph must be placed at an offset, which most APIs hide.

## 4.3 freetype-py

- **Name / version / licence.** `freetype-py` by Nicolas P. Rougier; **BSD / MIT-style** (exact licence **unverified**; upstream FreeType is FTL). **Version unverified.** Requires a native FreeType library (the docs also document FreeType **2.15.0**, released 2026-10-12). Note a separate, older package `freetypy` exists with a similar API; the identifiers below are for `freetype-py`.
- **Positioning.** A Pythonic wrapper over the full FreeType C API, exposing both a high-level object API and a low-level ctypes binding.
- **Source.** `https://freetype-py.readthedocs.io/en/stable/face.html`; `https://deepwiki.com/rougier/freetype-py/3-core-api-reference`; `https://freetypy.readthedocs.io/en/latest/intro.html` (for the `Outline.decompose` callback shape, from the sibling `freetypy` project); `https://freetype.org/`.

**Public interface by concern**

- *Library (verified).* `get_handle()`, `version()`, `set_lcd_filter()`, `set_lcd_filter_weights()`, `FT_Exception`, `Library`, `FT`.
- *Face (verified).* `Face(path_or_stream)`, `family_name`, `style_name`, `num_glyphs`, `num_faces`, `num_fixed_sizes`, `available_sizes`, `glyph`, `size`, `charmap`, `postscript_name`, `bbox`, `ascender`, `descender`, `height`, `max_advance_width`, `max_advance_height`, `underline_position`, `underline_thickness`, `units_per_EM` (**unverified**), `is_scalable`, `is_sfnt`, `is_fixed_width`, `is_cid_keyed`, `is_tricky`, `is_vertical` (**unverified**); `set_char_size(width=0, height=0, hres=72, vres=72)`, `set_pixel_sizes(width, height)`, `load_char(char, flags=4)`, `load_glyph(index, flags=4)`, `get_char_index(charcode)`, `get_name_index`, `get_glyph_name`, `select_charmap(encoding)`, `select_size(strike_index)`, `set_transform`, `get_kerning`, `get_track_kerning`, `get_first_char`, `get_next_char`, `attach_file`, `get_sfnt_name`, `get_sfnt_name_count`, `get_sfnt_table`, `set_var_design_coords`, `get_var_design_coords`, `set_var_blend_coords`, `get_var_blend_coords`, `get_var_axis_flags`, `set_instance` (**most of these exact names unverified**).
- *GlyphSlot (verified).* `face.glyph.metrics` (`GlyphMetrics`: `width`, `height`, `horiBearingX`, `horiBearingY`, `horiAdvance`, `vertBearingX`, `vertBearingY`, `vertAdvance`), `.bitmap` (`Bitmap`: `rows`, `width`, `pitch`, `buffer`, `pixel_mode`, `num_grays`), `.outline` (`Outline`), `.format`, `.advance`, `.linearHoriAdvance`, `.linearVertAdvance`, `.bitmap_left`, `.bitmap_top`, `.render()` / `FT_Render_Glyph`, `.get_glyph()`.
- *Outline (verified).* `Outline` with `n_contours`, `n_points`, `points`, `tags`, `contours`, `decompose()` (walk outline with callbacks), `get_bbox()` (exact bounding box), `get_cbox()` (control bounding box). The callback object methods are `move_to(point)`, `line_to(point)`, `conic_to(control, endpoint)`, `cubic_to(control1, control2, endpoint)` (verified from the `freetypy` sibling project's `Outline.decompose` documentation; the same `decompose` concept is listed in the freetype-py core reference). `decompose(callback_object, shift=0, delta=0)` with `x' = (x << shift) - delta`.
- *Metrics / sizes (verified).* `SizeMetrics` (`x_ppem`, `y_ppem`, `x_scale`, `y_scale`, `ascender`, `descender`, `height`, `max_advance`), `GlyphMetrics`, `Bitmap`, `Charmap`, `Vector`, `Matrix`, `BBox`.
- *Advanced (verified at feature level).* OT-SVG support via `SVG_RendererHooks` and `FT_SVG_Document`; variable fonts via `FT_Var_Axis`, `FT_Var_Named_Style`, `FT_MM_Var`; LCD filtering; `FT_LOAD_RENDER`, `FT_LOAD_NO_HINTING`, `FT_LOAD_NO_BITMAP`, `FT_LOAD_TARGET_LCD` load flags; `FT_RENDER_MODE_NORMAL`, `FT_RENDER_MODE_LCD`, `FT_RENDER_MODE_LIGHT`, `FT_RENDER_MODE_MONO`, `FT_RENDER_MODE_SDF` (verified as a FreeType render mode).

**Feature coverage.** TTF, OTF/CFF, CFF2, TTC and multi-face files, Type 1, CID, PFR, Windows FON, and SFNT-based embedded bitmaps; embedded bitmap strikes (`num_fixed_sizes`, `available_sizes`, `select_size`); native and auto hinting; LCD/subpixel filtering (`set_lcd_filter`, `set_lcd_filter_weights`, LCD render modes); SDF rendering (`FT_RENDER_MODE_SDF`); OT-SVG glyphs via renderer hooks; variable/multiple-master fonts; outline decomposition and exact/control bounding boxes; raster coverage bitmaps; vertical metrics; charmap selection; kerning. Shaping is out of scope (use `uharfbuzz`/HarfBuzz). No WOFF/WOFF2 at the wrapper level, no subsetting, no font writing, no font fallback.

**Architectural stance.** A thin, Pythonic binding with automatic memory management and `FT_Exception` conversion of C error codes; a singleton `FT_Library` via `get_handle()`. `Face` is mutable state with a single reusable `glyph` slot. The low-level ctypes API is also exposed for anything the high-level API omits. I/O coupled to a native shared library and file paths/streams.

**Suitability as a differential-test oracle.** Excellent for rasterisation and outline decomposition, with one caveat. `Outline.decompose` yields a `move_to/line_to/conic_to/cubic_to` command stream; `get_bbox()` versus `get_cbox()` yields two distinct boxes; `GlyphSlot.bitmap.buffer` yields a coverage bitmap; `GlyphMetrics.horiAdvance` yields a 26.6 fixed-point advance. Fully offline, but hinting and rasterisation are FreeType-version- and load-flag-dependent, so the FreeType version, `flags`, `set_char_size`/`set_pixel_sizes`, `set_lcd_filter` and render mode must be pinned. Note the `shift`/`delta` parameters of `decompose` transform coordinates — set them explicitly.

**Worth stealing for moonfont.** `Outline.decompose(callback_object, shift, delta)` with a duck-typed callback object (`move_to`, `line_to`, `conic_to`, `cubic_to`) is a third independent pen abstraction, and the explicit `shift`/`delta` fixed-point transform is a reminder that outline coordinates must be emitted in a declared, transformable unit. Also `get_bbox()` (exact) versus `get_cbox()` (control box) as separately named methods.

## 4.4 uharfbuzz

- **Name / version / licence.** `uharfbuzz`, the official Cython binding to HarfBuzz; **MIT** licence (HarfBuzz lineage; **exact licence unverified**), wheels bundle HarfBuzz. **Version unverified.**
- **Positioning.** A shaping-only library: it converts Unicode text plus a font face into positioned glyphs. It is the Python reference shaper and pairs naturally with freetype-py or fontTools.
- **Source.** `https://uharfbuzz.readthedocs.io/reference.html`; `https://deepwiki.com/harfbuzz/uharfbuzz/3.1-text-shaping`; `https://harfbuzz.github.io/a-simple-shaping-example.html`.

**Public interface by concern (verified)**

- *Container.* `hb.Face(data)` / `Face(blob, index)`, `hb.Font(face)`, `hb.Blob`, `hb.Buffer()`. `Face.upem`, `Face.glyph_count`, `Face.get_table(tag)`, `Face.reference_table(tag)`, `Font.face`, `Font.scale`, `Font.ppem`, `Font.ptem`, `Font.synthetic_slant`, `Font.synthetic_bold`, `Font.set_variations({tag: value})`, `Font.get_glyph_extents(glyph)`, `Font.get_nominal_glyph(codepoint)`, `Font.get_glyph_h_advance`, `Font.get_glyph_v_advance`, `Font.get_glyph_v_origin` (**some exact names unverified**).
- *Buffer.* `Buffer()`; `add_str(str)`, `add_utf8(bytes)`, `add_utf16`, `add_utf32`, `add_codepoints(list)`; properties `direction` (`"ltr"`, `"rtl"`, `"ttb"`, `"btt"`), `script` (ISO 15924, e.g. `"Latn"`, `"Arab"`), `language` (BCP 47), `cluster_level`, `flags`, `replacement_codepoint`, `invisible_glyph`, `not_found_glyph`, `glyph_infos`, `glyph_positions`; methods `guess_segment_properties()`, `clear_contents()`, `reset()`, `serialize(font, format=BufferSerializeFormat.TEXT, flags=...)`, `set_language_from_ot_tag(value)`, `set_script_from_ot_tag(value)`, `set_message_func(callback)`, `len(buf)`.
- *Shaping.* `hb.shape(font, buf, features=None, shaper=None)`; `features` as a dict of OpenType tag → bool; `GlyphInfo` with `.codepoint` and `.cluster`; `GlyphPosition` with `.x_advance`, `.y_advance`, `.x_offset`, `.y_offset`, `.var` (**exact members partly unverified**); `BufferClusterLevel` (`MONOTONE_GRAPHEMES`, `MONOTONE_CHARACTERS`, `CHARACTERS`, `DEFAULT`), `BufferFlags` (`BOT`, `EOT`, `PRESERVE_DEFAULT_IGNORABLES`, `REMOVE_DEFAULT_IGNORABLES`, `DO_NOT_INSERT_DOTTED_CIRCLE`, `VERIFY`, `PRODUCE_UNSAFE_TO_CONCAT`, `PRODUCE_SAFE_TO_INSERT_TATWEEL`, `DEFAULT`), `BufferSerializeFormat` (`TEXT`, `JSON`), `BufferSerializeFlags`, `BufferContentType`, `BufferDiffFlags`, `Face.set_upem`, `Font.scale = (1000, 1000)`.
- *Enums / helpers.* `hb.version_string()`, `hb.shapers`, `hb.ot_layout_table_get_feature_tags`, `hb.ot_var_normalize_variations`, `hb.ot_var_has_data`, `hb.subset` / `hb.Subsetter` (subsetting exists in HarfBuzz; **exact uharfbuzz API unverified**).

**Feature coverage.** GSUB/GPOS shaping, script/language/direction handling, cluster levels, variable-font axes (`set_variations`), vertical writing (`"ttb"`/`"btt"`), glyph extents and nominal glyph lookup, buffer serialisation for debugging. All font-format parsing is delegated to raw bytes handed in as a blob; outlines, rasterisation, colour glyphs and font writing are out of scope (subsetting **unverified**).

**Architectural stance.** A faithful, thin binding to the HarfBuzz C model with a clear `Blob → Face → Font → Buffer → shape()` pipeline. `Buffer` is explicitly "a reusable, caller-owned buffer": set text and properties, shape, read `glyph_infos`/`glyph_positions`, then `clear_contents()` to keep properties while dropping glyphs. Errors are Python exceptions over HarfBuzz status codes; I/O is just bytes in.

**Suitability as a differential-test oracle.** The best shaping oracle available. Wheels bundle HarfBuzz, so it is hermetic and offline; given a pinned uharfbuzz version, a font blob, a text string, `direction`, `script`, `language` and `cluster_level`, the output is fully deterministic. `glyph_infos` (glyph ids + clusters), `glyph_positions` (`x_advance`, `y_advance`, `x_offset`, `y_offset`) and `serialize()` (TEXT or JSON) are directly comparable. Tolerance concerns: HarfBuzz minor versions change shaping for complex scripts, so pin the wheel; `Font.scale` must be set to the font's upem for integer design-unit results.

**Worth stealing for moonfont.** The `Buffer` as a reusable, caller-owned object with `add_*` input methods, mutable `direction`/`script`/`language`/`cluster_level` properties, `guess_segment_properties()`, `clear_contents()` (keep configuration, drop glyphs) and `reset()`, plus `serialize()` for golden-file dumps. It is the cleanest shaping API shape in the survey and maps well onto a MoonBit `ShapeBuffer` struct.

## 4.5 reportlab (`pdfbase.ttfonts`)

- **Name / version / licence.** `reportlab`, the ReportLab PDF toolkit; **BSD-style licence** (exact SPDX **unverified**). **Version unverified.**
- **Positioning.** A PDF generation library; its `TTFont` class parses TrueType fonts for metric extraction and font subsetting/embedding into PDFs.
- **Source.** `https://www.reportlab.com/ftp/lennart/reportlab-userguide_patched.pdf`; `https://www.reportlab.com/`; `https://stackoverflow.com/questions/4899885/`.

**Public interface by concern (verified)**

- `from reportlab.pdfbase import pdfmetrics`; `from reportlab.pdfbase.ttfonts import TTFont`; `TTFont(name, filename, validate=0, subfontIndex=0, asciiReadable=None)` (**exact declaration partly unverified**); `pdfmetrics.registerFont(font)`, `pdfmetrics.registerFontFamily(family, normal=, bold=, italic=, boldItalic=)`, `pdfmetrics.getFont(name)`, `pdfmetrics.stringWidth(text, fontName, fontSize)`, `pdfmetrics.getAscent`, `getDescent`, `getRegisteredFontNames`, `getAvailableFonts`; `canvas.Canvas.setFont(name, size)`, `drawString(x, y, text)`, `getAvailableFonts()`; `reportlab.rl_config.warnOnMissingFontGlyphs`, `reportlab.rl_config.TTFSearchPath`; CLI-less but `reportlab.pdfbase.pdfmetrics` also has `Font`, `MultiByteFont` (for CJK), `UnicodeCIDFont`.
- Font discovery searches `TTFSearchPath` (Windows fonts folders, `/usr/share/fonts`, `~/Library/Fonts`, XDG paths, etc. — verified from a Stack Overflow answer quoting the config).

**Feature coverage.** TrueType (and limited OpenType) parsing for Unicode/UTF-8 text, font registration and family mapping, metric queries, automatic subsetting on PDF embed, and system font discovery via `TTFSearchPath`. No WOFF/WOFF2, no CFF2, no colour/variable fonts, no complex shaping, no outlines/metrics table API, no SDF/LCD/atlas, no font-file writing (it writes PDF subsets only).

**Architectural stance.** A document-pipeline component with a global mutable font registry (`pdfmetrics.registerFont`); `TTFont` is a parsed, mostly immutable description. I/O coupled to file paths and a configurable search path. Errors: `TTFError`, `KeyError` for unregistered fonts, warnings for missing glyphs.

**Suitability as a differential-test oracle.** Poor. `stringWidth` is a coarse metric and the API is oriented toward PDF output. Only useful for end-to-end PDF regression.

**Worth stealing for moonfont.** `registerFontFamily(family, normal=, bold=, italic=, boldItalic=)` — an explicit, named style-role mapping from a family to four concrete faces. Simple, declarative, and a good model for how a font collection should resolve a requested style.

## 4.6 matplotlib.font_manager

- **Name / version / licence.** `matplotlib.font_manager`, part of Matplotlib; **PSF-based / Matplotlib licence (BSD-compatible)** — **exact licence unverified**. **Version unverified.**
- **Positioning.** A font *discovery and matching* module for plot rendering: it scans system font directories, builds a font list and resolves a `FontProperties` request to a concrete font file.
- **Source.** `https://matplotlib.org/stable/api/font_manager_api.html` (referenced); `https://blog.csdn.net/Yn312/article/details/151020385` (secondary, for the method list below, tagged secondary).

**Public interface by concern (partly unverified, from a secondary reference)**

- `findfont(prop, fontext='ttf', directory=None, fallback_to_default=True, rebuild_if_missing=True)`, `FontProperties(family=None, style=None, variant=None, weight=None, stretch=None, size=None, fname=None, math_fontfamily=None)`, `FontProperties.get_family()`, `get_name()`, `get_style()`, `get_variant()`, `get_weight()`, `get_stretch()`, `get_size()`, `get_file()`, `set_family(...)`, `copy()`, `fontManager`, `fontManager.addfont(path)`, `fontManager.ttflist` (entries with `.name`, `.fname`, `.style`, `.weight`, `.stretch`, `.variant`), `findSystemFonts(fontpaths=None, fontext='ttf')`, `get_font_names()`, `json_dump`, `json_load`, `FontEntry`, `createFontList`, `get_fontext_synonyms`, `weight_as_number`, `stretch_as_number`, `OSXInstalledFonts`, `MSUserFontDirectories`, `X11FontDirectories`. Configuration via `plt.rcParams['font.family']`, `font.sans-serif`, `mathtext.fontset`. **Exact declarations unverified** against a primary page.

**Feature coverage.** System font enumeration (TTF, OTF, TTC), family/style/weight/stretch matching with a fallback list, per-text-object `FontProperties`, and a persistent `fontManager` cache. No cmap, outlines, metrics tables (beyond what matplotlib's text renderer needs), shaping, rasterisation API, colour/variable fonts, subsetting or font writing. Rendering is delegated to matplotlib's FreeType-based backend.

**Architectural stance.** A discovery/matching layer with a global, cached `fontManager` and immutable-ish `FontProperties` value objects. I/O coupled to OS font directories and the matplotlib config/cache. Errors fall back to a default font rather than raising.

**Suitability as a differential-test oracle.** Not an oracle; it is a discovery layer. Its value is as a model for how not to entangle font matching with font parsing.

**Worth stealing for moonfont.** `FontProperties` as a single immutable query object (family, style, variant, weight, stretch, size, optional explicit file) resolved by `findfont()` to a concrete file path, with the family list acting as a fallback chain. Keep matching wholly separate from parsing.

## 4.7 glyphsLib

- **Name / version / licence.** `glyphsLib` (googlefonts); **MIT** licence (verified from the repository's licence headers lineage; exact SPDX **unverified**). Version **6.12.2** observed on the consulted repository tag; **current stable unverified**.
- **Positioning.** A bridge from Glyphs source files (`.glyphs`) to UFOs and Designspace documents via defcon and designspaceLib; it is a *font source* library, not an SFNT binary parser.
- **Source.** `https://github.com/googlefonts/glyphsLib` (tag `v6.12.2` consulted via a mirror); `http://github.org/googlefonts/glyphsLib/tree/v6.12.2`.

**Public interface by concern (verified)**

- *Conversion.* `glyphsLib.build_masters(glyphs_file, master_dir)` → `(ufos, designspace_path)`, `glyphsLib.load_to_ufos(glyphs_file)`, `glyphsLib.load_to_ufos(...)` with `minimize_ufo_diffs`, `glyphsLib.to_glyphs(ufos_or_designspace)` (accepts a list of defcon `Font` objects or a `DesignSpaceDocument`), `glyphsLib.to_designspace(...)`, `glyphsLib.to_ufos(...)`, `glyphsLib.classes.GSFont`, `GSFont(glyphs_file)`, `font.save(path)`.
- *Object model.* `glyphsLib.classes` mirrors the Glyphs.app Python scripting API: `GSFont`, `GSFontMaster`, `GSGlyph`, `GSLayer`, `GSPath`, `GSNode`, `GSComponent`, `GSAnchor`, `GSGuide`, `GSClass`, `GSFeature`, `GSInstance`, `GSCustomParameter`, `GSAlignmentZone`, `GSAnnotation`, `GSHint`, `GSSmartComponentAxis`, `GSBackgroundImage`, `GSColor`, `GSTransformation`, `GSFontInfo` (**exact class set partly unverified**).
- *CLI.* `glyphs2ufo`, `ufo2glyphs` for round-tripping; `minimize_glyphs_diffs` / `minimize_ufo_diffs` bookkeeping flags.

**Feature coverage.** Reads and writes Glyphs source files, UFOs and Designspace files; masters, instances, axes and interpolation metadata (variable-font source level); glyph outlines, components, anchors, hints, features (`.fea`-style), kerning groups and classes; bidirectional Glyphs↔UFO conversion with diff-minimisation. It does not read or write SFNT/TTF/OTF/WOFF binaries — that is fontTools/fontmake's job. No rasterisation, no shaping, no colour glyphs at the binary level, no subsetting, no font discovery.

**Architectural stance.** A source-document object model with an explicit conversion boundary. `GSFont` is a mutable, rich object graph mirroring a desktop application's scripting API; conversion functions are pure-ish transformations that can optionally write files. I/O coupled to `.glyphs` plist/JSON, UFO directories and `.designspace`. Errors are ordinary Python exceptions.

**Suitability as a differential-test oracle.** Not suitable for binary font comparison; it operates one level above the compiled font. It is, however, a useful oracle for source-level round-tripping and for verifying that variable-font axis/instance metadata survives a conversion.

**Worth stealing for moonfont.** The `build_masters` / `load_to_ufos` distinction — "write files to disk" versus "return the intermediate objects without writing" — is a clean API pattern. Expose a `load()` that returns the full in-memory model and a separate `save()`/`build()` that materialises it, so a caller can inspect or diff without touching the filesystem.

---

# 5. Best-of-breed union: a checklist for moonfont

The following is the union of capabilities worth targeting, ordered by concern. Each item names the library or libraries that demonstrate it best.

### Container and table access

- [ ] Parse TTF (`glyf`), OTF/CFF (`CFF `), **CFF2**, TTC, WOFF and **WOFF2** from a single `Font`/`Typeface` entry point (fontTools, SixLabors.Fonts, fontkit, Typography.OpenFont/OpenFontSharp).
- [ ] **Lazy, on-demand table decompilation** via `font[tag]` / `getTable(tag)` with an explicit `parseOnDemand` switch and `ensureDecompiled()` (fontTools, FontBox `TTFParser(isEmbedded, parseOnDemand)`).
- [ ] A **metadata-only preview** tier, a **metrics-only** tier and a **full outlines** tier, with reversible unload of heavy outline data (`OpenFontReader.ReadPreview`, `FontDescription.LoadDescription`, `TypefaceExtensions.TrimDown`/`RestoreUp`).
- [ ] A **plain, inspectable table bag** returned by a single call (`fonteditor-core`'s `font.get()`, opentype.js's `font.toTables()`), so an inspector can be built by reflection.
- [ ] Keep WOFF2/Brotli as a **separate, explicitly initialised codec** yielding plain SFNT bytes, with injectable `inflate`/`deflate` callbacks; never let compression leak into the table model (wawoff2, fonteditor-core `woff2.init()`, `Woff2Converter.ToSfnt`).
- [ ] Expose the **font collection index** as an explicit parameter (`FontProgramFactory.createFont(ttc, ttcIndex, cached)`, PIL `truetype(..., index=0)`, `fontkit.create(buffer, postscriptName)`).

### Character mapping and metrics

- [ ] One convenience method for the preferred Unicode cmap (`font.getBestCmap()`, `TrueTypeFont.getUnicodeCmapLookup()`, `GlyphTypeface.CharacterToGlyphMap`) plus raw subtable access for specialists.
- [ ] Integer advance widths in font units, accessible per glyph id and per glyph name (`hmtx.metrics`, `HorizontalMetricsTable.getAdvanceWidth`, `GetAdvanceWidthFromGlyphIndex`, `FontProgram.getWidth`, `GlyphTypeface.AdvanceWidths`).
- [ ] A minimal, named **vertical metrics record** (`{capHeight, ascent, descent, lineGap, unitsPerEm}` as in capsize), with `xHeight`, `sTypoAscender`, `usWinAscent`, `sxHeight`, `sCapHeight` reachable too.
- [ ] Four explicitly distinct boxes: **advance**, **logical/alignment box**, **tight ink box**, **device pixel box** (Java2D `getStringBounds`/`getLogicalBounds` vs `getBounds`/`getVisualBounds`/`getPixelBounds`; fontkit `bbox` vs `cbox`; fontTools `BoundsPen` vs `ControlBoundsPen`; FreeType `get_bbox()` vs `get_cbox()`; Canvas `actualBoundingBox*` vs `fontBoundingBox*`; `GlyphRun.ComputeAlignmentBox()`/`ComputeInkBoundingBox()`).
- [ ] Advance width defined as "the offset at which the next text begins", at sub-pixel precision and distinct from the ink box (`Pillow getlength`, `Font.getAdvanceWidth`, `TextMeasurer.MeasureAdvance`).

### Glyph outlines and the pen abstraction

- [ ] A **`Pen` trait/interface** with `moveTo`, `lineTo`, `curveTo` (cubic), `qCurveTo` (quadratic), `closePath`, `endPath`, `addComponent`, and `glyph.draw(pen)` on every glyph (fontTools Pen Protocol — the single most reusable idea in this survey).
- [ ] A family of small pens: **recording** (`RecordingPen.value`, or Typr's `{cmds, crds}` flat arrays), **bounds** (`BoundsPen`), **control bounds** (`ControlBoundsPen`), **SVG** (`SVGPathPen.getCommands()`), **transform** (`TransformPen`), **statistics** (`StatisticsPen`), and a **glyph builder** (`TTGlyphPen`). Equivalent callback interfaces exist in SixLabors.Fonts (`IGlyphRenderer`), OpenFontSharp (`IGlyphTranslator`), SharpFont/freetype-py/freetypy (`Outline.decompose` with `move_to`/`line_to`/`conic_to`/`cubic_to`), and Typr (`pathToContext`).
- [ ] Keep **unscaled outline in font units (y-up)** and **scaled/y-flipped outline at a size** as two separate calls (opentype.js `glyph.path` vs `glyph.getPath(x, y, fontSize)`).
- [ ] Represent "no outline" honestly: a nullable `Path` when the glyph is bitmap-described (Skiko `Font.getPath(glyph): Path?`), not an empty path or an exception.
- [ ] A **path-to-string / path-to-SVG** method on the path value itself for golden files (`opentype.js Path.toPathData`/`toSVG`, opentype4j `Path.toSVG()`, fontkit `Path.toSVG()`, Typr `pathToSVG()`).
- [ ] Emit coordinates in a **declared, transformable unit** with an explicit fixed-point shift/delta (`freetypy Outline.decompose(shift, delta)`).

### Rasterisation

- [ ] A **coverage bitmap** value with `rows`, `width`, `pitch`, `buffer` and `pixel_mode` (FreeType `Bitmap`, freetype-py `GlyphSlot.bitmap`, Pillow `getmask`), returned together with its **placement offset** (Pillow `getmask2` → `(mask, offset)`).
- [ ] **Caller-controlled** hinting, auto-hinting, edging, subpixel and LCD switches rather than hidden renderer state (SkiaSharp `SKFont.Hinting`, `ForceAutoHinting`, `LinearMetrics`, `Subpixel`, `Edging`, `LcdRenderText`; SixLabors.Fonts `HintingMode`).
- [ ] SDF rendering as a first-class render mode (`FT_RENDER_MODE_SDF`), even if only as a flag, because it is the one feature almost no managed library exposes.
- [ ] Embedded bitmap strike selection (`Face.select_size`, `SKFont.EmbeddedBitmaps`, `Font.setBitmapsEmbedded`).

### Layout and shaping

- [ ] A reusable, caller-owned **shape buffer** with `add_utf8`/`add_str`/`add_codepoints`, mutable `direction`/`script`/`language`/`cluster_level`, `guess_segment_properties()`, `clear_contents()` (keep config, drop glyphs), `reset()` and `serialize()` (uharfbuzz `Buffer`; HarfBuzz C model).
- [ ] A **shaped-run value type** with parallel arrays: glyph ids, advances, offsets, characters, a **cluster map** and caret stops (WPF `GlyphRun`; fontkit `GlyphRun` with `GlyphPosition{xAdvance,yAdvance,xOffset,yOffset}`; Typr `shape()` returning `{g, cl, ax, ay, dx, dy}`; SixLabors.Fonts `ShapedGlyph`/`TextShapingBuffer`).
- [ ] **Shape once, measure/render many times** as an explicit object (SixLabors.Fonts `TextBlock`, WPF `FormattedText`/`TextLine`, Skiko `TextLine`).
- [ ] **Hit testing and caret geometry** as part of the shaped result (`TextLayout.hitTestChar`, `GlyphRun.GetCaretCharacterHitFromDistance`, `TextLine.getOffsetAtCoord`/`getCoordAtOffset`, `TextMetrics.GetSelectionBounds`).
- [ ] An explicit separation between naive **character-to-glyph lookup** and real **shaping** (fontkit `glyphForCodePoint`/`glyphsForString` versus `layout`; opentype.js `stringToGlyphs` versus `getPath`).
- [ ] **Line breaking (UAX 14), bidirectional text, justification and vertical writing** as configurable options on one `TextOptions`-style object (SixLabors.Fonts, Java2D `TextLayout`).
- [ ] **Pluggable shapers and formats** with tree-shakeable registration (fontkit `registerFormat`/`registerShaper`).

### Colour, bitmaps and variable fonts

- [ ] COLR/CPAL **v0 and v1** (including the v1 paint graph), SVG-table glyphs, `sbix`, and CBDT/CBLC (fontTools, SixLabors.Fonts; note OpenFontSharp loads COLRv1 but does not interpret the paint graph, and opentype.js supports only COLRv0).
- [ ] Variable fonts with named axis tags, per-axis `min`/`default`/`max`, `getVariation()`/`set()` returning a derived font, and **static instancing** (`fontTools.varLib.instancer.instantiateVariableFont`, `FontVariation`/`KnownVariationAxes`, fontkit `variationAxes`/`namedVariations`/`getVariation`, Pillow `get_variation_axes`/`set_variation_by_axes`, `FontSubsetter.Subset(..., axisCoordinates)`).
- [ ] A colour-glyph rendering surface that receives **layered paint and gradients** (`IColorGlyphRenderer`, `FontPalette`/`FontPaletteOverride`, `GetColorLayers`/`GetPalette`).

### Subsetting, writing and compiling

- [ ] **Subsetting** with explicit unicode/glyph/text selection and glyph-id remapping (`fontTools.subset.Subsetter.populate/subset`, `pyftsubset`, `TTFSubsetter`, `font.createSubset()`/`Subset.includeGlyph`/`encode`, `FontSubsetter`, `ToUnicodeCMapBuilder`).
- [ ] **Font construction from scratch** via a builder (`fontTools.fontBuilder.FontBuilder`, `new opentype.Font({...})`, `new opentype.Glyph({...})`, `TTGlyphPen.glyph()`).
- [ ] **Byte-level round-tripping** (`TTFont.save`, `Font.toArrayBuffer`, `fonteditor-core font.write`, `@cantoo/fontkit Subset.encode()`).
- [ ] **Feature file compilation** (`.fea` → GSUB/GPOS via `fontTools.feaLib.builder.addOpenTypeFeatures`) and **GSUB feature baking** as a compile-time alternative to run-time shaping (opentype-feature-freeze concept).
- [ ] **Margin/box recalculation** and checksum handling on save (fontTools `SFNTWriter.calcChecksum`, `recalcBBoxes`).

### Discovery, fallback and API hygiene

- [ ] A **collection → family → concrete font** hierarchy with `Add`/`TryGet`/`CreateFont` and system-font enumeration (`SixLabors.Fonts FontCollection`/`SystemFonts`, `matplotlib findfont`, `FontFileFinder`, `SKFontManager.MatchCharacter`).
- [ ] A style-role mapping and a **fallback chain** as data (`registerFontFamily`, `FallbackFontFamilies`, `IFontFallbackResolver`, `createFontStack` metric-matched fallbacks, `FontTriplet`/`FontResolver`).
- [ ] Immutable or **explicitly scoped mutability**: immutable `Font`/`TextLayout`, mutable `GlyphVector`/`Buffer`/`Font`, native handles with `close()`/`Dispose()`, and `clone()`/`font_variant()`/`makeWithSize()` for derived instances.
- [ ] A **typed error hierarchy** distinguishing invalid file, invalid table, missing table, missing family, missing glyph and damaged font (`FontException`, `InvalidFontFileException`, `InvalidFontTableException`, `MissingFontTableException`, `GlyphMissingException`, `FontFamilyNotFoundException`, `FT_Exception`, `InvalidDataException`).
- [ ] Convert C-style error codes to exceptions and `out` parameters to return values in any native binding (SharpFont's documented approach).
- [ ] **Optional native dependencies**, with pure-managed fallbacks where possible (SixLabors.Fonts "no native dependencies to ship"; fontTools "no external dependencies besides the Python Standard Library").
- [ ] Explicit **load-time subsetting** so a parse never materialises glyphs the caller does not need (fonteditor-core `subset` option, opentype.js lazy `Glyph.path` thunks).

### Differential-test oracles to adopt first

1. **fontTools** — the canonical, pure-Python, standard-library-only oracle. Compare `getBestCmap()`, `hmtx.metrics`, `BoundsPen.bounds` / `ControlBoundsPen.controlBounds`, `RecordingPen.value` / `SVGPathPen.getCommands()`, and `TTFont.save()` round-trips.
2. **opentype.js** — a pure-JS, offline, integer-font-unit oracle. Compare `charToGlyph`/`stringToGlyphs`, `glyph.advanceWidth`, `glyph.getBoundingBox()`, `font.getAdvanceWidth`, `path.commands` (`M/L/Q/C/Z`) and `font.toArrayBuffer()`.
3. **uharfbuzz** — the shaping oracle, with a bundled HarfBuzz wheel for hermetic reproducibility. Compare `glyph_infos` (glyph ids + clusters), `glyph_positions` (`x_advance`, `y_advance`, `x_offset`, `y_offset`) and `Buffer.serialize()`.

Secondary but valuable: **Apache FontBox** as an independent pure-Java oracle for cmap/advance/bbox triples; **freetype-py + Pillow `ImageFont`** for coverage bitmaps and 1/64-pixel advances with a pinned FreeType build; **OpenFontSharp / Typography.OpenFont** as a pure-C# oracle for integer design-unit metrics and `IGlyphTranslator` outline streams; **Typr.js** for a second, independent `{cmds, crds}` outline and `{g, cl, ax, ay, dx, dy}` shape stream.

**Tolerance concerns to encode in any test harness.** Pin library versions (HarfBuzz minor releases change complex-script shaping; FreeType minor releases change hinting and rasterisation; Skia versions change glyph ids and advances). Distinguish tight ink bounds from control boxes and from logical/alignment boxes before comparing; never compare a `ControlBoundsPen`/`cbox`/`get_cbox` result against a `BoundsPen`/`bbox`/`get_bbox` result. Normalise quadratic (`qCurveTo`, implied on-curve points) and cubic (`curveTo`) command streams to one representation. Work in integer font units with `Font.scale = (upem, upem)` rather than device pixels. Fix hinting, subpixel, LCD, `FontRenderContext`, `Dpi`, direction, script, language and cluster level explicitly. Pin cmap subtable selection (the "best" cmap is a preference, not a constant). Normalise or exclude SVG-colour command tokens (`Typr` `"#rrggbb"`/`"X"`) and COLR layer ordering. For byte-level comparisons, control timestamps, checksums, table ordering and WOFF2/Brotli encoder versions.

---

# 6. Sources

Primary and secondary sources consulted. Items tagged *secondary* are repository mirrors, third-party references or synopses rather than official API documentation; identifiers drawn only from them are marked "unverified" in the body.

### Java / JVM

1. Apache PDFBox — `https://pdfbox.apache.org/`
2. FontBox `org.apache.fontbox.ttf` package Javadoc — `https://pdfbox.apache.org/docs/2.0.4/javadocs/org/apache/fontbox/ttf/package-summary.html`
3. FontBox `TTFParser` Javadoc — `http://git-wip-us.apache.org/repos/asf/pdfbox-docs/blob/559848ce/content/docs/2.0.6/javadocs/org/apache/fontbox/ttf/TTFParser.html`
4. Apache mailing-list Javadoc diff (`CmapSubtable`, `CmapTable`, `SubstitutingCmapLookup`) — `https://lists.apache.org/thread.html/hsgxcokdx09sp3gs24lfwc0mk0m8z5qp` (secondary)
5. Oracle JDK 12 `java.awt.Font` Javadoc — `https://docs.oracle.com/en/java/javase/12/docs/api/java.desktop/java/awt/Font.html`
6. Oracle JDK 6 `FontMetrics` Javadoc — `https://docs.oracle.com/javase/6/docs/api/java/awt/FontMetrics.html`
7. Oracle JDK 6 `TextLayout` Javadoc — `https://docs.oracle.com/javase/6/docs/api/java/awt/font/TextLayout.html`
8. JDK 27 early-access `Font` Javadoc — `https://download.java.net/java/early_access/jdk27/docs/api/java.desktop/java/awt/Font.html`
9. Apache FOP — `https://xmlgraphics.apache.org/fop/` and `https://xmlgraphics.apache.org/fop/download.html`
10. iText legal / licensing — `https://itextpdf.com/how-buy/legal/copyright-intellectual-property`
11. iText 7.1.3 Java `FontProgramFactory` Javadoc — `https://api.itextpdf.com/iText/java/7.1.3/com/itextpdf/io/font/FontProgramFactory.html`
12. iText 7.2.0 .NET `FontProgramFactory` reference — `https://api.itextpdf.com/iText/dotnet/7.2.0/classi_text_1_1_i_o_1_1_font_1_1_font_program_factory.html`
13. JetBrains Skiko `Font` API — `https://jetbrains.github.io/skiko/skiko/org.jetbrains.skia/-font/index.html`
14. JetBrains Skija Getting Started — `https://github.com/JetBrains/skija/blob/65b3e73a775de3d0b9fe7ac77475c18510e44d9f/docs/Getting%20Started.md`
15. Skiko shaping/TextLine synopsis — `https://deepwiki.com/JetBrains/skiko/7.5.2-shaping-textblob-and-textline` (secondary)
16. Skia documentation — `https://docs.skia.org`
17. opentype4j README — `https://github.com/Jkanon/opentype4j/blob/master/README.md` and `https://gitee.com/lt1946/opentype4j`
18. PDF generation licensing survey (iText/FOP licences, add-ons) — `https://www.irurueta.com/backend/pdf-generation/introduction-and-approaches.html` (secondary)

### C# / .NET

19. SixLabors.Fonts product page — `https://sixlabors.com/products/fonts/`
20. SixLabors.Fonts current API namespace — `https://docs.sixlabors.com/api/Fonts/SixLabors.Fonts.html`
21. SixLabors.Fonts v1/v2-era API namespace — `https://docs-v2.sixlabors.com/api/Fonts/SixLabors.Fonts.html`
22. SixLabors.Fonts getting started — `https://docs.sixlabors.com/articles/fonts/gettingstarted.html`
23. SixLabors.Fonts introduction and licence — `https://docs.sixlabors.com/articles/fonts/`
24. SixLabors.Fonts 1.0.0 announcement — `https://sixlabors.com/posts/announcing-fonts-100/`
25. SixLabors.Fonts 2.0.0 on NuGet — `https://www.nuget.org/packages/SixLabors.Fonts/2.0.0`
26. Microsoft Learn `SKFont` — `https://learn.microsoft.com/en-us/dotnet/api/skiasharp.skfont`
27. Microsoft Learn `SKPaint` — `https://learn.microsoft.com/en-sg/dotnet/api/skiasharp.skpaint`
28. DNDocs `SKPaint` 1.56.0 — `https://docs.dndocs.com/n/SkiaSharp/1.56.0/api/SkiaSharp.SKPaint.html`
29. SkiaSharp C# tutorial — `https://zetcode.com/csharp/skiasharp/`
30. SharpFont README (MIT, API simplification, errors) — `https://github.com/Yellow-Dog-Man/SharpFont` and `http://github.chaintip.org/space-wizards/SharpFont` (mirror, secondary)
31. Microsoft Learn `GlyphTypeface` — `https://learn.microsoft.com/en-ca/dotnet/api/system.windows.media.glyphtypeface?view=net-8.0`
32. Microsoft `GlyphRun` class reference — `https://technet.microsoft.com/en-us/subscriptions/system.windows.media.glyphrun.aspx`
33. Microsoft `GlyphRun` constructors — `https://technet.microsoft.com/zh-cn/ms602447`
34. OpenFontSharp 1.4.0 on NuGet — `https://www.nuget.org/packages/OpenFontSharp/`
35. OpenFontSharp 1.2.2 on NuGet — `https://www.nuget.org/packages/OpenFontSharp/1.2.2`
36. Typography / PixelFarm project mirror and licence — `https://patch-diff.githubusercontent.com/kniEngine/kniDependencies.Typography` (secondary)

### JavaScript / TypeScript

37. opentype.js GitHub README — `https://github.com/opentypejs/opentype.js`
38. opentype.js 1.3.3 README on unpkg — `https://app.unpkg.com/opentype.js@1.3.3/files/README.md`
39. opentype.js 1.3.0 README on npmx — `https://npmx.dev/package/opentype.js/v/1.3.0`
40. opentype.js detailed code/API analysis (variation, pens, colour, path commands) — `https://sparkles.petar-kirov.dev/research/font-libraries/opentype-js` (secondary)
41. opentype.js README mirror — `https://github.com/FranzPoize/opentype.js` (mirror, secondary)
42. `@pdf-lib/fontkit` README (full fontkit API) — `https://www.npmjs.com/package/@pdf-lib/fontkit`
43. fontkit API reference index (Typogram) — `https://fontkit.typogram.co/reference` (secondary, third-party documentation)
44. `@cantoo/fontkit` 2.0.12 release (fork API) — `https://libraries.io/npm/@cantoo%2Ffontkit` (secondary)
45. foliojs/fontkit repository synopsis (core/formats/shapers registries) — `https://discovergit.app/repo/foliojs/fontkit/review` (secondary)
46. `@mormahr/foliojs-fontkit` package metadata — `https://www.jsdelivr.com/package/npm/@mormahr/foliojs-fontkit`
47. Typr.js README — `https://github.com/meiling413code/Typr.js`
48. Typr.ts (lojjic fork) README — `https://github.com/lojjic/Typr.ts/tree/feature/package`
49. Typr.ts (lTyl) README — `http://github.chaintip.org/lTyl/Typr.ts` (mirror, secondary)
50. capsize GitHub README — `https://github.com/seek-oss/capsize`
51. capsize project site — `https://seek-oss.github.io/capsize/`
52. fonteditor-core GitHub — `https://github.com/kekee000/fonteditor-core`
53. fonteditor-core 2.1.8 README on unpkg — `https://app.unpkg.com/fonteditor-core@2.1.8/files/README.md`
54. HarfBuzz "A simple shaping example" (C model behind harfbuzzjs) — `https://harfbuzz.github.io/a-simple-shaping-example.html`
55. Third-party OSS notice citing opentype.js 1.3.4 MIT — `https://tasvisuals.com/third-party-licenses.php` (secondary)
56. WOFF2 background — `https://www.w3.org/` (WOFF2 Recommendation, March 2018; referenced via secondary sources)

### Python

57. fontTools official documentation (licence, modules, CLI tools) — `https://fonttools.readthedocs.io/`
58. fontTools repository overview and code map — `https://deepwiki.com/fonttools/fonttools/1-overview` (secondary)
59. OpenType font-table reference (table/tag list) — `https://simoncozens.github.io/gf-docs/fonttables.html` (secondary)
60. Pillow `PIL.ImageFont` source — `https://pillow.readthedocs.io/en/stable/_modules/PIL/ImageFont.html`
61. Pillow `ImageFont` reference — `https://pillow.readthedocs.io/en/stable/reference/ImageFont.html` (also the zh-cn mirror `https://pillow.pythonlang.cn/en/stable/reference/ImageFont.html`)
62. Pillow `ImageFont` complete API for 13.0.0 — `https://pillowpython.com/reference/imagefont` (secondary)
63. freetype-py Core API reference — `https://deepwiki.com/rougier/freetype-py/3-core-api-reference` (secondary)
64. freetype-py `Face` documentation — `https://freetype-py.readthedocs.io/en/stable/face.html`
65. freetypy `Outline.decompose` documentation (sibling project, callback shape) — `https://freetypy.readthedocs.io/en/latest/_generated/freetypy.Outline.decompose.html`
66. FreeType project and 2.15.0 release — `https://freetype.org/`
67. uharfbuzz API reference — `https://uharfbuzz.readthedocs.io/reference.html`
68. uharfbuzz text shaping synopsis — `https://deepwiki.com/harfbuzz/uharfbuzz/3.1-text-shaping` (secondary)
69. ReportLab PDF Library User Guide — `https://www.reportlab.com/ftp/lennart/reportlab-userguide_patched.pdf`
70. ReportLab product site — `https://www.reportlab.com/`
71. ReportLab TTFont registration and `TTFSearchPath` — `https://stackoverflow.com/questions/4899885/how-to-set-any-font-in-reportlab-canvas-in-python` (secondary)
72. matplotlib.font_manager usage synopsis — `https://blog.csdn.net/Yn312/article/details/151020385` (secondary)
73. glyphsLib repository (tag v6.12.2) — `http://github.org/googlefonts/glyphsLib/tree/v6.12.2` (mirror, secondary); upstream `https://github.com/googlefonts/glyphsLib`
74. fontTools 4.47.2 MIT in a third-party OSS inventory — `https://en-documents.research.global.fujitsu.com/auto-data-wrangling/figures/%E5%88%A9%E7%94%A8OSS%E3%83%AA%E3%82%B9%E3%83%88en.pdf` (secondary)
