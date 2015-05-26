Vagrant.configure("2") do |config|
  config.vm.box = "phusion/ubuntu-14.04-amd64"

  # We need to configure docker to expose port 60366
  config.vm.provision "shell", inline: <<-SCRIPT

SCRIPT

  config.vm.provision "shell", path: 'vagrant.sh'
  config.vm.provision "docker", images: [], version: "1.6.1"

end
