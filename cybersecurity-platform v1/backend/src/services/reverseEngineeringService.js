const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ReverseEngineeringService {
  constructor() {
    this.supportedFormats = {
      executables: ['exe', 'dll', 'so', 'dylib'],
      archives: ['zip', 'rar', '7z', 'tar', 'gz'],
      documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
      images: ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
      containers: ['docker', 'iso', 'vmdk']
    };
  }

  // File Analysis
  async analyzeFile(filePath) {
    try {
      const fileStats = await fs.stat(filePath);
      const fileContent = await fs.readFile(filePath);
      
      const analysis = {
        metadata: {
          name: path.basename(filePath),
          size: fileStats.size,
          created: fileStats.birthtime,
          modified: fileStats.mtime,
          type: this.detectFileType(fileContent),
          hash: {
            md5: crypto.createHash('md5').update(fileContent).digest('hex'),
            sha1: crypto.createHash('sha1').update(fileContent).digest('hex'),
            sha256: crypto.createHash('sha256').update(fileContent).digest('hex')
          }
        },
        strings: await this.extractStrings(fileContent),
        entropy: this.calculateEntropy(fileContent),
        sections: await this.analyzeSections(filePath),
        imports: await this.analyzeImports(filePath),
        exports: await this.analyzeExports(filePath),
        resources: await this.analyzeResources(filePath),
        security: await this.analyzeSecurity(filePath)
      };

      return analysis;
    } catch (error) {
      throw new Error(`File analysis failed: ${error.message}`);
    }
  }

  // String Extraction
  async extractStrings(fileContent, minLength = 4) {
    const strings = [];
    let currentString = '';
    
    for (let i = 0; i < fileContent.length; i++) {
      const byte = fileContent[i];
      if (byte >= 32 && byte <= 126) {
        currentString += String.fromCharCode(byte);
      } else {
        if (currentString.length >= minLength) {
          strings.push(currentString);
        }
        currentString = '';
      }
    }
    
    if (currentString.length >= minLength) {
      strings.push(currentString);
    }
    
    return strings;
  }

  // Entropy Analysis
  calculateEntropy(data) {
    const frequencies = new Array(256).fill(0);
    for (let i = 0; i < data.length; i++) {
      frequencies[data[i]]++;
    }

    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      if (frequencies[i] === 0) continue;
      const frequency = frequencies[i] / data.length;
      entropy -= frequency * Math.log2(frequency);
    }

    return entropy;
  }

  // Section Analysis
  async analyzeSections(filePath) {
    try {
      const { stdout } = await execPromise(`objdump -h ${filePath}`);
      const sections = [];
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('Idx')) continue;
        if (line.trim() === '') continue;
        
        const parts = line.split(/\s+/);
        if (parts.length >= 7) {
          sections.push({
            name: parts[1],
            size: parseInt(parts[2], 16),
            virtualAddress: parseInt(parts[3], 16),
            fileOffset: parseInt(parts[4], 16),
            alignment: parseInt(parts[6], 16)
          });
        }
      }
      
      return sections;
    } catch (error) {
      console.error('Section analysis failed:', error);
      return [];
    }
  }

  // Import Analysis
  async analyzeImports(filePath) {
    try {
      const { stdout } = await execPromise(`objdump -T ${filePath}`);
      const imports = [];
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('DYNAMIC SYMBOL TABLE')) continue;
        if (line.trim() === '') continue;
        
        const parts = line.split(/\s+/);
        if (parts.length >= 6) {
          imports.push({
            address: parts[0],
            type: parts[1],
            name: parts[5]
          });
        }
      }
      
      return imports;
    } catch (error) {
      console.error('Import analysis failed:', error);
      return [];
    }
  }

  // Export Analysis
  async analyzeExports(filePath) {
    try {
      const { stdout } = await execPromise(`objdump -T ${filePath}`);
      const exports = [];
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('DYNAMIC SYMBOL TABLE')) continue;
        if (line.trim() === '') continue;
        
        const parts = line.split(/\s+/);
        if (parts.length >= 6 && parts[1].includes('*UND*')) {
          exports.push({
            address: parts[0],
            type: parts[1],
            name: parts[5]
          });
        }
      }
      
      return exports;
    } catch (error) {
      console.error('Export analysis failed:', error);
      return [];
    }
  }

  // Resource Analysis
  async analyzeResources(filePath) {
    try {
      const { stdout } = await execPromise(`objdump -s -j .rodata ${filePath}`);
      const resources = [];
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('Contents of section')) continue;
        if (line.trim() === '') continue;
        
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          resources.push({
            offset: parts[0],
            data: parts.slice(1).join(' ')
          });
        }
      }
      
      return resources;
    } catch (error) {
      console.error('Resource analysis failed:', error);
      return [];
    }
  }

  // Security Analysis
  async analyzeSecurity(filePath) {
    try {
      const security = {
        aslr: await this.checkASLR(filePath),
        dep: await this.checkDEP(filePath),
        canary: await this.checkStackCanary(filePath),
        relro: await this.checkRELRO(filePath),
        pie: await this.checkPIE(filePath),
        nx: await this.checkNX(filePath)
      };
      
      return security;
    } catch (error) {
      console.error('Security analysis failed:', error);
      return {};
    }
  }

  // Security Checks
  async checkASLR(filePath) {
    try {
      const { stdout } = await execPromise(`readelf -h ${filePath}`);
      return stdout.includes('Position Independent Executable');
    } catch (error) {
      return false;
    }
  }

  async checkDEP(filePath) {
    try {
      const { stdout } = await execPromise(`readelf -l ${filePath}`);
      return stdout.includes('GNU_STACK') && !stdout.includes('RWE');
    } catch (error) {
      return false;
    }
  }

  async checkStackCanary(filePath) {
    try {
      const { stdout } = await execPromise(`readelf -s ${filePath}`);
      return stdout.includes('__stack_chk_fail');
    } catch (error) {
      return false;
    }
  }

  async checkRELRO(filePath) {
    try {
      const { stdout } = await execPromise(`readelf -d ${filePath}`);
      return stdout.includes('BIND_NOW');
    } catch (error) {
      return false;
    }
  }

  async checkPIE(filePath) {
    try {
      const { stdout } = await execPromise(`readelf -h ${filePath}`);
      return stdout.includes('Type: DYN');
    } catch (error) {
      return false;
    }
  }

  async checkNX(filePath) {
    try {
      const { stdout } = await execPromise(`readelf -l ${filePath}`);
      return stdout.includes('GNU_STACK') && !stdout.includes('E');
    } catch (error) {
      return false;
    }
  }

  // File Type Detection
  detectFileType(fileContent) {
    const signatures = {
      'MZ': 'PE/COFF',
      'ELF': 'ELF',
      'PK': 'ZIP',
      'Rar!': 'RAR',
      '7F45': 'ELF',
      '25504446': 'PDF',
      'D0CF11E0': 'Office Document',
      '89504E47': 'PNG',
      'FFD8FF': 'JPEG',
      '47494638': 'GIF',
      '424D': 'BMP'
    };

    const hexSignature = fileContent.slice(0, 8).toString('hex').toUpperCase();
    
    for (const [signature, type] of Object.entries(signatures)) {
      if (hexSignature.startsWith(signature)) {
        return type;
      }
    }

    return 'Unknown';
  }

  // Container Analysis
  async analyzeContainer(containerPath) {
    try {
      const analysis = {
        metadata: await this.analyzeContainerMetadata(containerPath),
        layers: await this.analyzeContainerLayers(containerPath),
        configuration: await this.analyzeContainerConfig(containerPath),
        security: await this.analyzeContainerSecurity(containerPath)
      };

      return analysis;
    } catch (error) {
      throw new Error(`Container analysis failed: ${error.message}`);
    }
  }

  async analyzeContainerMetadata(containerPath) {
    try {
      const { stdout } = await execPromise(`docker inspect ${containerPath}`);
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Container metadata analysis failed:', error);
      return {};
    }
  }

  async analyzeContainerLayers(containerPath) {
    try {
      const { stdout } = await execPromise(`docker history ${containerPath}`);
      const layers = [];
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('IMAGE')) continue;
        if (line.trim() === '') continue;
        
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          layers.push({
            id: parts[0],
            created: parts[1],
            size: parts[2],
            command: parts.slice(3).join(' ')
          });
        }
      }
      
      return layers;
    } catch (error) {
      console.error('Container layer analysis failed:', error);
      return [];
    }
  }

  async analyzeContainerConfig(containerPath) {
    try {
      const { stdout } = await execPromise(`docker inspect ${containerPath}`);
      const config = JSON.parse(stdout);
      return {
        cmd: config[0].Config.Cmd,
        entrypoint: config[0].Config.Entrypoint,
        env: config[0].Config.Env,
        exposedPorts: config[0].Config.ExposedPorts,
        volumes: config[0].Config.Volumes,
        workingDir: config[0].Config.WorkingDir
      };
    } catch (error) {
      console.error('Container config analysis failed:', error);
      return {};
    }
  }

  async analyzeContainerSecurity(containerPath) {
    try {
      const security = {
        privileged: await this.checkContainerPrivileged(containerPath),
        capabilities: await this.checkContainerCapabilities(containerPath),
        seccomp: await this.checkContainerSeccomp(containerPath),
        apparmor: await this.checkContainerAppArmor(containerPath)
      };
      
      return security;
    } catch (error) {
      console.error('Container security analysis failed:', error);
      return {};
    }
  }

  async checkContainerPrivileged(containerPath) {
    try {
      const { stdout } = await execPromise(`docker inspect ${containerPath}`);
      const config = JSON.parse(stdout);
      return config[0].HostConfig.Privileged;
    } catch (error) {
      return false;
    }
  }

  async checkContainerCapabilities(containerPath) {
    try {
      const { stdout } = await execPromise(`docker inspect ${containerPath}`);
      const config = JSON.parse(stdout);
      return config[0].HostConfig.CapAdd || [];
    } catch (error) {
      return [];
    }
  }

  async checkContainerSeccomp(containerPath) {
    try {
      const { stdout } = await execPromise(`docker inspect ${containerPath}`);
      const config = JSON.parse(stdout);
      return config[0].HostConfig.SecurityOpt?.includes('seccomp') || false;
    } catch (error) {
      return false;
    }
  }

  async checkContainerAppArmor(containerPath) {
    try {
      const { stdout } = await execPromise(`docker inspect ${containerPath}`);
      const config = JSON.parse(stdout);
      return config[0].HostConfig.SecurityOpt?.includes('apparmor') || false;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new ReverseEngineeringService(); 