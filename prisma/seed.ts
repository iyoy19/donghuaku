import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create genres
  const genres = await Promise.all([
    prisma.genre.upsert({
      where: { id: 16 },
      update: {},
      create: {
        id: 16,
        name: 'Animation',
      },
    }),
    prisma.genre.upsert({
      where: { id: 10759 },
      update: {},
      create: {
        id: 10759,
        name: 'Action & Adventure',
      },
    }),
    prisma.genre.upsert({
      where: { id: 18 },
      update: {},
      create: {
        id: 18,
        name: 'Drama',
      },
    },
    ),
    prisma.genre.upsert({
      where: { id: 14 },
      update: {},
      create: {
        id: 14,
        name: 'Fantasy',
      },
    }),
  ]);

  console.log('✅ Created genres');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@donghuaku.com',
    },
  });

  console.log('✅ Created admin user');

  // Create sample donghua
  const donghua1 = await prisma.donghua.upsert({
    where: { tmdbId: 12345 },
    update: {},
    create: {
      tmdbId: 12345,
      title: 'Soul Land',
      chineseTitle: '斗罗大陆',
      overview: 'A story about Tang San who enters a world of soul masters.',
      synopsis: 'Tang San enters the Soul Land world and begins his journey to become a powerful soul master.',
      posterPath: '/poster1.jpg',
      backdropPath: '/backdrop1.jpg',
      releaseDate: new Date('2018-01-20'),
      voteAverage: 8.5,
      voteCount: 15000,
      status: 'ongoing',
      episodeCount: 250,
      mediaType: 'tv',
      genreIds: [16, 10759],
      genres: {
        connect: [{ id: 16 }, { id: 10759 }],
      },
    },
  });

  const donghua2 = await prisma.donghua.upsert({
    where: { tmdbId: 67890 },
    update: {},
    create: {
      tmdbId: 67890,
      title: 'Battle Through the Heavens',
      chineseTitle: '斗破苍穹',
      overview: "Xiao Yan's journey to become the strongest alchemist.",
      synopsis: 'Xiao Yan embarks on a journey to regain his lost powers and become the strongest.',
      posterPath: '/poster2.jpg',
      backdropPath: '/backdrop2.jpg',
      releaseDate: new Date('2017-01-07'),
      voteAverage: 8.2,
      voteCount: 12000,
      status: 'ongoing',
      episodeCount: 200,
      mediaType: 'tv',
      genreIds: [16, 10759],
      genres: {
        connect: [{ id: 16 }, { id: 10759 }],
      },
    },
  });

  console.log('✅ Created donghua');

  // Create sample episodes for donghua1
  const episodes1 = [
    {
      id: '1-1',
      episodeNumber: 1,
      title: 'The Beginning',
      thumbnail: 'https://via.placeholder.com/400x225',
      duration: 24,
      airDate: new Date('2024-01-15'),
      servers: [
        { name: 'Streamwish', url: 'https://embedwish.com/e/abcd123' },
        { name: 'Doodstream', url: 'https://dood.la/e/xyz789' },
        { name: 'OK.ru', url: 'https://ok.ru/videoembed/def456' },
      ],
      subtitles: [
        { lang: 'English', url: '/subs/1-1-en.vtt' },
        { lang: 'Chinese', url: '/subs/1-1-zh.vtt' },
      ],
    },
    {
      id: '1-2',
      episodeNumber: 2,
      title: 'The Journey Begins',
      thumbnail: 'https://via.placeholder.com/400x225',
      duration: 24,
      airDate: new Date('2024-01-22'),
      servers: [
        { name: 'Streamwish', url: 'https://embedwish.com/e/abcd124' },
        { name: 'Doodstream', url: 'https://dood.la/e/xyz790' },
        { name: 'OK.ru', url: 'https://ok.ru/videoembed/def457' },
      ],
    },
    {
      id: '1-3',
      episodeNumber: 3,
      title: 'First Battle',
      thumbnail: 'https://via.placeholder.com/400x225',
      duration: 24,
      airDate: new Date('2024-01-29'),
      servers: [
        { name: 'Streamwish', url: 'https://embedwish.com/e/abcd125' },
        { name: 'Doodstream', url: 'https://dood.la/e/xyz791' },
        { name: 'OK.ru', url: 'https://ok.ru/videoembed/def458' },
      ],
    },
  ];

  for (const episode of episodes1) {
    await prisma.episode.upsert({
      where: { id: episode.id },
      update: {},
      create: {
        id: episode.id,
        donghuaId: donghua1.id,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        thumbnail: episode.thumbnail,
        duration: episode.duration,
        airDate: episode.airDate,
        servers: episode.servers,
        subtitles: episode.subtitles,
      },
    });
  }

  // Create sample episodes for donghua2
  const episodes2 = [
    {
      id: '2-1',
      episodeNumber: 1,
      title: 'The Awakening',
      thumbnail: 'https://via.placeholder.com/400x225',
      duration: 24,
      airDate: new Date('2024-02-01'),
      servers: [
        { name: 'Streamwish', url: 'https://embedwish.com/e/abcd200' },
        { name: 'Doodstream', url: 'https://dood.la/e/xyz800' },
      ],
    },
  ];

  for (const episode of episodes2) {
    await prisma.episode.upsert({
      where: { id: episode.id },
      update: {},
      create: {
        id: episode.id,
        donghuaId: donghua2.id,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        thumbnail: episode.thumbnail,
        duration: episode.duration,
        airDate: episode.airDate,
        servers: episode.servers,
        subtitles: episode.subtitles || [],
      },
    });
  }

  console.log('✅ Created episodes');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
