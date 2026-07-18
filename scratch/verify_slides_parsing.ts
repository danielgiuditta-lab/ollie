import assert from 'assert';

function testSlideParsing() {
  const contentStr = `TBD pending UI text discussion...
\x0c
Questions?
\x0c
Appendix
\x0c
Project Ollie
Tech Stack (WIP)
\x0c
Pic file https://docs.google.com/images/d/1fUKdOqmPyGA-hjoA-rNr0WP4T8xZinDOV-eCAmDNuDA/edit?usp=sharing
We're starting with proactive defaults globally with the ability to set stream-level exceptions.`;

  const fileName = '[Project Ollie] Leadership Update — July 20.gslides';

  let normalizedContent = contentStr.replace(/[\f\x0c\u000c]/g, '\n\n---\n\n');

  let rawSlides = normalizedContent
    .split(/(?=\n# )|(?=^# )|\n---|(?=\n---\n)/g)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0 && s !== '---');

  if (rawSlides.length <= 1 && normalizedContent.includes('\n\n\n')) {
    rawSlides = normalizedContent
      .split(/\n\n\n+/g)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }

  rawSlides = rawSlides.map((slideText: string) => {
    const trimmed = slideText.trim();
    if (!trimmed) return `# ${fileName.replace(/\.[^/.]+$/, '')}`;
    if (trimmed.startsWith('#')) return trimmed;

    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return `# ${fileName.replace(/\.[^/.]+$/, '')}`;

    const firstLine = lines[0].replace(/^#+\s*/, '');
    const remainingLines = lines.slice(1);

    if (remainingLines.length === 0) {
      return `# ${firstLine}`;
    }

    const formattedRemaining = remainingLines.map(line => {
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || line.startsWith('#') || line.startsWith('>')) {
        return line;
      }
      if (line.toLowerCase().startsWith('pic file') || line.startsWith('http')) {
        return `> ${line}`;
      }
      return `- ${line}`;
    }).join('\n');

    return `# ${firstLine}\n\n${formattedRemaining}`;
  });

  console.log(`Parsed ${rawSlides.length} slides:`);
  rawSlides.forEach((slide, idx) => {
    console.log(`--- Slide ${idx + 1} ---`);
    console.log(slide);
  });

  assert.strictEqual(rawSlides.length, 5, 'Should have parsed exactly 5 slides');
  assert.ok(rawSlides[0].includes('TBD pending UI text discussion'), 'Slide 1 check');
  assert.ok(rawSlides[1].includes('Questions?'), 'Slide 2 check');
  assert.ok(rawSlides[2].includes('Appendix'), 'Slide 3 check');
  assert.ok(rawSlides[3].includes('Project Ollie'), 'Slide 4 check');
  assert.ok(rawSlides[4].includes('Pic file'), 'Slide 5 check');

  console.log('✅ ALL SLIDE PARSING TESTS PASSED!');
}

testSlideParsing();
