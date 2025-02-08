# WeNads Frontend

WeNads is a Soulbound Token (SBT) collection with a unique twist: each wallet address is entitled to only one NFT. Breaking away from traditional SBT constraints, WeNads empowers you to customize your avatar's components whenever inspiration strikes! What sets us apart? Each component exists as a tradeable NFT, and here's what makes it special: you can design, mint, and market your own component templates, fostering a genuinely community-driven ecosystem. Best of all, every asset lives permanently on-chain!🔥

This repo is for frontend, and [this](https://github.com/LanfordCai/wenads) is for smart contracts.

## Prerequisites

- Node.js 16.x or later
- npm or yarn package manager
- MetaMask or similar Web3 wallet
- Access to Monad devnet

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/wenads-fe.git
cd wenads-fe
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add necessary environment variables:
```env
NEXT_PUBLIC_AVATAR_CONTRACT="Your WeNadsContract"
NEXT_PUBLIC_COMPONENT_CONTRACT="Your WeNadsComponentContract"
NEXT_PUBLIC_ENV="You env, production or development"
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
src/
├── app/               # Next.js app directory
│   ├── builder/      # Component builder feature
│   ├── gallery/      # NFT gallery feature
│   └── components/   # Shared components
├── contracts/        # Smart contract ABIs and config
├── lib/             # Utility functions and configurations
└── types/           # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
