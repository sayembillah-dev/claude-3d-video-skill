# Publish kit: What If You Could Store Files in Your DNA?

## Titles (pick one, all under 60 characters)
1. What If You Saved Files in Your DNA?  (38)
2. Your Body Is Already a Hard Drive  (34)
3. One Gram of DNA Holds 215 Petabytes  (36)

## Description
You already carry a hard drive: about 750 MB of DNA in every cell. What if you could save your own files in it? Here's how DNA data storage really works, and why your selfie would cost more than your phone.

Fact check
| Claim in the video | Verdict | Source |
|---|---|---|
| About 750 MB of data in one human genome (about 3 billion base pairs x 2 bits) | Correct as arithmetic (a haploid genome at 2 bits per base; real files need error correction) | https://www.genome.gov/Pages/Education/Smithsonian_Exhibition/Human_Genome_Project_FAQ.pdf (NHGRI: one genome is about 3 billion base pairs) |
| About 37 trillion cells in the body | Estimate (37.2 trillion, Bianconi et al. 2013, "An estimation of the number of cells in the human body") | DOI 10.3109/03014460.2013.807878 (Ann Hum Biol 2013; 40(6): 463-471), https://www.fermatslibrary.com/s/an-estimation-of-the-number-of-cells-in-the-human-body |
| 28 zettabytes if every cell held one different genome-sized file | Hypothetical arithmetic: 37.2e12 x 0.75 GB. Real cells copy the same DNA, and red blood cells have none | n/a (what-if) |
| 215 petabytes in one gram of DNA, read back perfectly (2017) | Correct: DNA Fountain, Erlich and Zielinski, Science 2017 (lab result, not a product) | https://magazine.engineering.columbia.edu/spring-2018/dna-next-hard-drive |
| A movie and an operating system were stored and recovered | Correct: same study | https://datascience.columbia.edu/news/2017/researchers-store-computer-operating-system-and-short-movie-on-dna/ |
| One gram is "about a paperclip" | Standard paperclips weigh about 1 g | general knowledge |
| DNA can last thousands of years | Optimistic end: cool, dry storage; sources range from centuries to tens of thousands of years | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9706676/ |
| Writing costs thousands of dollars per megabyte; reading takes hours | Chemical synthesis is quoted around $3,500 per MB (Wyss Institute); other analyses give about $100 per MB today. "Thousands" is the older, higher figure. Reading takes hours to days | https://wyss.harvard.edu/technology/DNA-data-storage/ , https://blocksandfiles.com/2026/01/16/dna-data-storage-when-the-physics-work-but-the-economics-dont/ |
| Copying DNA risks typos | Correct in general: mutations arise during replication; the "different vacation" is the what-if | general biology |

Sources are linked above. This is a what-if video; the hypothetical parts are marked.

## Hashtags
#shorts #DNA #science #whatif #datastorage

## Tags
DNA data storage, DNA storage, what if, what if you could store data in DNA, human genome, genome size, how much data in DNA, DNA hard drive,
science shorts, cartoon explainer, biology facts, petabytes, zettabytes, DNA Fountain, future technology

## Thumbnails
- Vertical 1080x1920: `out/dna-drive/thumb_vertical.png` ("YOUR BODY IS A HARD DRIVE", accent on HARD DRIVE).
- Wide 1280x720: `out/dna-drive/thumb_wide.png` (same title, subjects on the right).
- Both come from frame 140 rendered without captions (person grinning beside the DNA helix). Compositions: `DnaDriveThumb`, `DnaDriveThumbWide` in `src/Root.tsx`; the source frames in `public/_render/` were removed after rendering, so re-extract frame 140 (captions off) before re-rendering them.
