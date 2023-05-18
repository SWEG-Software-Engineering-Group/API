# Translatify API

Translatify is a MultiTenant based Web Application used to help organize, manage and translate all kind of Texts in different languages.

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="https://github.com/SWEG-Software-Engineering-Group/SWEG-Software-Engineering-Group.github.io/blob/main/img/sweg_logo.png" alt="Logo of the organization SWEG" width="240" height="70">
  </a>

  <h1 align="center">Translatify API</h1>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

Hosted on Amawon Web Services this software offers a multiplatform backend where an organization can add and translate texts in different languages and an API library to allow to retrive the texts in the desired language and use them on their own  Websites and Web Applications as pleased. 

### API

This repo contains the main software with the API functions that run under AWS. It features all the lambdas functions available. The data is stored in dynamoDB. Cognito is used to secure all the functions that are used by the translating process for the organization, while the other funcions to retrive the texts are public. A Postman json is included with the list of all the different functions available.

_For more examples, please refer to the [Documentation](https://github.com/SWEG-Software-Engineering-Group/SWEG-Software-Engineering-Group.github.io/blob/main/pb/esterni/Manuale%20Sviluppatore/Manuale%20Sviluppatore.pdf), only available in italian at the moment_

### Built With

* [![AWS][AWS.com]][AWS-url]
* [![React][React.js]][React-url]
* [![Node][Node.js]][Node-url]
* [![TS][Typescript.js]][Typescript-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

_Below is an example of how you can instruct your audience on installing and setting up your app. This template doesn't rely on any external dependencies or services._

### Prerequisites

Make sure you have the latest version of [npm](npm-url).
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Download and install [AWS CLI](aws-cli-url)
2. Clone the repo
   ```sh
   git clone https://github.com/SWEG-Software-Engineering-Group/API.git
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Install serverless framework package
   ```sh
   npm i -g serverless
   ```
5. Configure AWS CLI with your credentials as explained [here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html)

6. Run serverless
   ```sh
   cd API-Progetto
   serverless start
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

Import `SWEG.postman_environment.json` and `translatify_postman.json` into Postman.
Go under environment variables and change the Authentication Token with the one you get afer logging in inside the platform as Admin. Then you can change the other parameters used in the calls on your need.



<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[AWS.com]: https://p.kindpng.com/picc/s/152-1522129_how-to-manage-and-automate-aws-ebs-snapshots.pngstyle=for-the-badge&logo=nextdotjs&logoColor=white
[AWS-url]: https://aws.amazon.com/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Node.js]: https://www.extraordy.com/wp-content/uploads/2013/11/nodejs1-300x99.png
[Node-url]: https://nodejs.org/
[Typescript.js]: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxKb9uozM0xitpv6k8O016WGAhIJ13ka2s0H1WirPkt4pML3sHYaadM276qBR6afOjmXA
[Typescript-url]: https://www.typescriptlang.org/
[npm-url]: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
[aws-cli-url]: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
