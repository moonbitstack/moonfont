// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The corpus is a contract, not a smoke test. Each malformed font must name the
// refusal its manifest records, and each legal-but-unusual font must be
// accepted. A single assertion over an accumulated report shows every mismatch
// in one run rather than stopping at the first.

///|
fn refusal_name(bytes : Bytes) -> String {
  try {
    let face = @moonfont.decode(bytes, limits=@moonfont.limits_strict)
    for i in 0..<face.num_glyphs() {
      let _ = face.outline(@moonfont.GlyphId::of(i))
    }
    ""
  } catch {
    error => error.name()
  }
}

///|
test "each corpus case yields its contracted refusal" {
  let mut report = ""
  for case in corpus_cases {
    let (name, bytes, expected, accepted) = case
    let actual = refusal_name(bytes)
    if accepted {
      if actual != "" {
        report = report + "\{name}: accepted font refused with \{actual}\n"
      }
    } else if actual != expected {
      report = report + "\{name}: got \{actual}, want \{expected}\n"
    }
  }
  assert_eq(report, "")
}

///|
test "every refusal name in the corpus is a declared variant" {
  let allowed = [
    "Unknown", "Unexpected", "Unsupported", "Truncated", "OverLimit", "Malformed",
    "MissingTable", "MissingGlyph", "Recursion",
  ]
  for case in corpus_cases {
    let (_, bytes, _, _) = case
    let actual = refusal_name(bytes)
    if actual != "" {
      let mut found = false
      for name in allowed {
        if name == actual {
          found = true
        }
      }
      assert_eq(found, true)
    }
  }
}
