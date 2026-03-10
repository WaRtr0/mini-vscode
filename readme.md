# Mini-VSCode

**Mini-VSCode** is a mini-project specifically designed to showcase the power and utility of the **[FsBrowserSide](https://github.com/WaRtr0/FsBrowserSide)** library. 

It is a fully browser-based code editor capable of interacting with your local files using the same principles as the Node.js `fs` API, but purely on the client side.

## Features & Usage Modes

The application highlights the flexibility of `FsBrowserSide` by offering two distinct read/write modes depending on your browser and needs:

### 1. Live Local Editing (Recommended Mode)
This mode allows for **direct reading and writing on your hard drive**. 
It uses the *File System Access API* (`showDirectoryPicker`) to establish a direct link with the folder of your choice. The changes you make in the editor are instantly saved to your computer, just like a real local IDE.

> **Live Local Editing Demonstration:**
> 
> *xx*

---

### 2. Draft Mode (OPFS - Origin Private File System)
In this mode, the application will "download" the entire content of the selected folder and **copy it into the browser's private storage** (OPFS). 

**Please note for this mode:**
* We do not recommend loading overly large folders in this mode, as the initial copying process can take time and consume browser storage space.
* This mode is useful if you want to work in a strictly isolated environment (for security reasons).
* **It is mandatory on Firefox**, as this browser does not yet support direct local file system access (`showDirectoryPicker`).

> **Draft Mode (OPFS) Demonstration:**
> 
> *xx*

## Built With

* **[FsBrowserSide](https://github.com/WaRtr0/FsBrowserSide)**: The core file system library.
* **React / TypeScript**: For the user interface and logic.
* **CodeMirror 6**: For the text editor.
* **Tailwind CSS & Shadcn/UI**: For the modern design components.

## Contributing

You are completely free to contribute to this project! It would be my pleasure to review and accept your *Pull Requests* or *Issues* to improve this demo.

Whether it's fixing a bug, adding a new feature (like a terminal, a better file tree, etc.), or tweaking the design, please jump right in!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
